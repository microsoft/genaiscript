/**
 * An AI model that can be used to create embeddings.
 */
export interface EmbeddingsModel {
    /**
     * Maximum number of tokens
     */
    readonly maxTokens: number

    /**
     * Creates embeddings for the given inputs.
     * @param inputs Text inputs to create embeddings for.
     * @returns A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.
     */
    createEmbeddings(inputs: string | string[]): Promise<EmbeddingsResponse>
}

/**
 * Status of the embeddings response.
 * @remarks
 * `success` - The embeddings were successfully created.
 * `error` - An error occurred while creating the embeddings.
 * `rate_limited` - The request was rate limited.
 */
export type EmbeddingsResponseStatus =
    | "success"
    | "error"
    | "rate_limited"
    | "cancelled"

/**
 * Response returned by a `EmbeddingsClient`.
 */
export interface EmbeddingsResponse {
    /**
     * Status of the embeddings response.
     */
    status: EmbeddingsResponseStatus

    /**
     * Optional. Embeddings for the given inputs.
     */
    output?: number[][]

    /**
     * Optional. Message when status is not equal to `success`.
     */
    message?: string

    /**
     * Optional. Model used to create the embeddings.
     */
    model?: string

    /**
     * Optional. Usage statistics for the request.
     */
    usage?: Record<string, any>
}

export interface TextChunk {
    text: string
    tokens: number[]
    startPos: number
    endPos: number
    startOverlap: number[]
    endOverlap: number[]
}

export interface TextFetcher {
    fetch(
        uri: string,
        onDocument: (
            uri: string,
            text: string,
            docType?: string
        ) => Promise<boolean>
    ): Promise<boolean>
}

export interface IndexStats {
    version: number
    metadata_config: {
        indexed?: string[]
    }
    items: number
}

export interface IndexItem<TMetadata = Record<string, MetadataTypes>> {
    id: string
    metadata: TMetadata
    vector: number[]
    norm: number
    metadataFile?: string
}

export interface MetadataFilter {
    /**
     * Equal to (number, string, boolean)
     */
    $eq?: number | string | boolean

    /**
     * Not equal to (number, string, boolean)
     */
    $ne?: number | string | boolean

    /**
     * Greater than (number)
     */
    $gt?: number

    /**
     * Greater than or equal to (number)
     */
    $gte?: number

    /**
     * Less than (number)
     */
    $lt?: number

    /**
     * Less than or equal to (number)
     */
    $lte?: number

    /**
     * In array (string or number)
     */
    $in?: (number | string)[]

    /**
     * Not in array (string or number)
     */
    $nin?: (number | string)[]

    /**
     * AND (MetadataFilter[])
     */
    $and?: MetadataFilter[]

    /**
     * OR (MetadataFilter[])
     */
    $or?: MetadataFilter[]

    [key: string]: unknown
}

export type MetadataTypes = number | string | boolean

export interface QueryResult<TMetadata = Record<string, MetadataTypes>> {
    item: IndexItem<TMetadata>
    score: number
}

export interface DocumentChunkMetadata {
    documentId: string
    startPos: number
    endPos: number
    [key: string]: MetadataTypes
}

export interface DocumentCatalogStats {
    version: number
    documents: number
    chunks: number
    metadata_config: {
        indexed?: string[]
    }
}

export interface DocumentTextSection {
    text: string
    tokenCount: number
    score: number
}
