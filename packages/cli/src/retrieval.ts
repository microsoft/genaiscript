import { expandFiles } from "../../core/src/fs"
import { fuzzSearch } from "../../core/src/fuzzsearch"
import {
    upsertVector,
    clearVectorIndex,
    vectorSearch,
} from "../../core/src/retrieval"
import { normalizeFloat, normalizeInt } from "../../core/src/util"
import { YAMLStringify } from "../../core/src/yaml"
import { createProgressSpinner } from "./spinner"

export async function retrievalIndex(
    files: string[],
    options: {
        excludedFiles: string[]
        name: string
        model: string
        temperature: string
        chunkSize: string
        chunkOverlap: string
    }
) {
    const {
        excludedFiles,
        name: indexName,
        model,
        temperature,
        chunkOverlap,
        chunkSize,
    } = options || {}
    const fs = await expandFiles(files, excludedFiles)
    if (!fs.length) {
        console.error("no files matching")
        return
    }

    const progress = createProgressSpinner(`indexing ${fs.length} files`)
    await upsertVector(fs, {
        progress,
        indexName,
        embedModel: model,
        temperature: normalizeFloat(temperature),
        chunkOverlap: normalizeInt(chunkOverlap),
        chunkSize: normalizeInt(chunkSize),
    })
}

export async function retrievalClear(options: {
    name: string
    summary: boolean
}) {
    const { name: indexName, summary } = options || {}
    await clearVectorIndex({ indexName })
}

export async function retrievalSearch(
    q: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        topK: string
        name: string
    }
) {
    const { excludedFiles, name: indexName, topK } = options || {}
    const files = await expandFiles(filesGlobs, excludedFiles)
    const progress = createProgressSpinner(
        `searching '${q}' in ${files.length} files`
    )
    const res = await vectorSearch(q, {
        files,
        topK: normalizeInt(topK),
        indexName,
        progress,
    })
    progress.stop()
    console.log(YAMLStringify(res))
}

export async function retrievalFuzz(
    q: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        topK: string
    }
) {
    let { excludedFiles, topK } = options || {}
    if (!filesGlobs?.length) filesGlobs = ["**"]
    if (!excludedFiles?.length) excludedFiles = ["**/node_modules/**"]
    const files = await expandFiles(filesGlobs, excludedFiles)
    const progress = createProgressSpinner(
        `searching '${q}' in ${files.length} files`
    )
    const res = await fuzzSearch(
        q,
        files.map((filename) => ({ filename })),
        { topK: normalizeInt(topK) }
    )
    progress.stop()
    console.log(YAMLStringify(res))
}
