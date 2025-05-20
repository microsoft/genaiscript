import { CancellationOptions, checkCancelled, toSignal } from "./cancellation"
import { EmbeddingFunction, WorkspaceFileIndexCreator } from "./chat"
import { arrayify } from "./cleaners"
import { TraceOptions } from "./trace"
import { logVerbose } from "./util"
import { resolveFileContent } from "./file"
import { chunk } from "./encoders"
import { hash } from "./crypto"
import { genaiscriptDebug } from "./debug"
import { LanguageModelConfiguration } from "./server/messages"

const dbg = genaiscriptDebug("pgvector")
const HASH_LENGTH = 64

/**
 * Utility – convert JS number[] to the textual pgvector literal: `[1,2,3]`
 */
const toPgVector = (v: number[]) => `[${v.map((v) => Number(v)).join(",")}]`

interface VectorIndexOptions {
    deleteIfExists?: boolean
    chunkOverlap?: number
    chunkSize?: number
    vectorSize?: number
}

interface VectorSearchOptions {
    topK?: number
    minScore?: number
}

type ElementOrArray<T> = T | T[]

/**
 * Postgres/pgvector‐backed implementation of WorkspaceFileIndex
 */
export const postgresVectorIndex: WorkspaceFileIndexCreator = async (
    indexName: string,
    cfg: LanguageModelConfiguration,
    embedder: EmbeddingFunction,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
) => {
    const {
        trace,
        cancellationToken,
        deleteIfExists,
        chunkOverlap = 128,
        chunkSize = 512,
        vectorSize = 1536,
    } = options || {}
    if (!indexName || /[^a-z0-9]/.test(indexName))
        throw new Error("Invalid index name")
    dbg(`index: %s`, indexName)

    const { Client } = await import("pg")
    const connectionString =
        process.env.PGVECTOR_CONNECTION_STRING ||
        process.env.DATABASE_URL ||
        "postgres://postgres:postgres@localhost:5432/postgres"

    dbg(`connecting: %s`, connectionString)
    const client = new Client({ connectionString })
    await client.connect()

    // keep the connection open while the returned object is alive
    const ensureSchema = async () => {
        dbg(`creating schema`)
        await client.query(`CREATE EXTENSION IF NOT EXISTS vector`)
        if (deleteIfExists) {
            dbg(`dropping existing index table %s`, indexName)
            await client.query(`DROP TABLE IF EXISTS ${indexName}`)
        }
        await client.query(
            `CREATE TABLE IF NOT EXISTS ${indexName}(
                id           TEXT PRIMARY KEY,
                filename     TEXT,
                line_start   INT,
                line_end     INT,
                content      TEXT,
                content_vector vector(${vectorSize})
            )`
        )
        // hnsw index for cosine/L2 distance
        await client.query(
            `CREATE INDEX IF NOT EXISTS ${indexName}_vec_hnsw
             ON ${indexName} USING hnsw (content_vector vector_l2_ops)
             WITH (m = 16, ef_construction = 64)`
        )
        dbg(`schema created`)
    }
    await ensureSchema()
    checkCancelled(cancellationToken)
    type TextChunkEntry = TextChunk & { id: string; content_vector: number[] }

    const chunkId = async (c: TextChunk) =>
        await hash([c.filename ?? c.content, c.lineStart, c.lineEnd], {
            length: HASH_LENGTH,
        })
    return Object.freeze({
        name: indexName,

        /** Insert or update embeddings for one file or an array of files */
        insertOrUpdate: async (file: ElementOrArray<WorkspaceFile>) => {
            const files = arrayify(file)

            for (const f of files) {
                checkCancelled(cancellationToken)
                if (!f.filename) {
                    dbg(`skipping file without filename`)
                    continue
                }
                dbg(`resolving content for %s`, f.filename)
                await resolveFileContent(f, { cancellationToken })
                if (f.encoding) continue // skip binary blobs

                const outdatedIds: string[] = []
                const docs: TextChunkEntry[] = []
                const newChunks = await chunk(f, { chunkSize, chunkOverlap })
                dbg(`chunked into %d chunks`, f.filename, newChunks.length)

                // existing chunks for that file
                const { rows: oldChunks } = (await client.query(
                    `SELECT id, line_start AS "lineStart", line_end AS "lineEnd", content
                     FROM ${indexName}
                     WHERE filename = $1`,
                    [f.filename]
                )) as { rows: TextChunk[] }

                // detect unchanged / outdated rows
                for (const old of oldChunks) {
                    const idx = newChunks.findIndex(
                        (c) =>
                            c.lineStart === old.lineStart &&
                            c.lineEnd === old.lineEnd &&
                            c.content === old.content
                    )
                    if (idx > -1) {
                        newChunks.splice(idx, 1) // unchanged
                    } else {
                        outdatedIds.push((old as any).id)
                    }
                }

                for (const c of newChunks) {
                    const vec = await embedder(c.content, cfg, options)
                    checkCancelled(cancellationToken)
                    if (vec.status !== "success")
                        throw new Error(vec.error || vec.status)

                    docs.push({
                        id: await chunkId(c),
                        ...c,
                        content_vector: vec.data[0],
                    })
                }

                logVerbose(
                    `pgvector: ${indexName}: ${outdatedIds.length} outdated, ${docs.length} new`
                )

                if (outdatedIds.length) {
                    dbg(`delete outdated chunks %o`, outdatedIds)
                    await client.query(
                        `DELETE FROM ${indexName} WHERE id = ANY($1::text[])`,
                        [outdatedIds]
                    )
                }
                if (!docs.length) continue

                // batch UPSERT
                const valuesClause = docs
                    .map(
                        (_, i) =>
                            `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3},
                          $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6}::vector)`
                    )
                    .join(",")
                const params: any[] = []
                for (const d of docs) {
                    params.push(
                        d.id,
                        d.filename,
                        d.lineStart,
                        d.lineEnd,
                        d.content,
                        toPgVector(d.content_vector)
                    )
                }
                dbg(`inserting %d chunks`, docs.length)
                await client.query(
                    `INSERT INTO ${indexName}
                 (id, filename, line_start, line_end, content, content_vector)
                 VALUES ${valuesClause}
                 ON CONFLICT (id) DO UPDATE SET
                     content        = EXCLUDED.content,
                     content_vector = EXCLUDED.content_vector`,
                    params
                )
            }
        },

        /** Vector-similarity search */
        search: async (query: string, opts?: VectorSearchOptions) => {
            const { topK = 10, minScore = 0 } = opts || {}

            const vec = await embedder(query, cfg, { trace, cancellationToken })
            checkCancelled(cancellationToken)
            if (vec.status !== "success")
                throw new Error(vec.error || vec.status)

            const literal = toPgVector(vec.data[0])

            // nearest-neighbor by L2 (<->) + convert distance to [0,1] score
            const { rows } = await client.query(
                `SELECT filename,
                        line_start AS "lineStart",
                        line_end   AS "lineEnd",
                        content,
                        1 - (content_vector <=> $1::vector) AS score
                 FROM ${indexName}
                 ORDER BY content_vector <-> $1::vector
                 LIMIT $2`,
                [literal, topK]
            )

            return (rows as WorkspaceFileWithScore[]).filter(
                (r) => r.score >= minScore
            )
        },
    } satisfies WorkspaceFileIndex)
}
