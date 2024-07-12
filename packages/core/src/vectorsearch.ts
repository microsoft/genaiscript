import { encode } from "gpt-tokenizer"
import { RetrievalSearchResponse } from "./host"

export async function vectorSearch(
    files: WorkspaceFile[],
    vector: number[],
    options?: VectorSearchOptions
) {
    const { topK, minScore } = options || {}
    const normv = normL2(vector)
    if (normv === 0) return []

    // split in chunks and index
    let results: {
        file: WorkspaceFile
        chunk: { content: string }
        vector: number[]
        distance: number
    }[] = []
    for (const file of files) {
        for (const chunk of splitFile(file)) {
            const vectorc = encode(chunk.content)
            const normc = normL2(vectorc)
            const distance = dotProduct(vector, vectorc) / (normv * normc)
            results.push({ file, chunk, vector: vectorc, distance })
        }
    }
    // sort by distance DESCENDING
    results.sort((a, b) => b.distance - a.distance)
    if (!isNaN(topK)) results = results.slice(0, topK)
    if (!isNaN(minScore))
        results = results.filter((item) => item.distance >= minScore)
    return results
}

function splitFile(file: WorkspaceFile) {
    return [{ content: file.content }]
}

function dotProduct(a: number[], b: number[]) {
    let sum = 0
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i]
    }
    return sum
}

function normL2(vector: number[]) {
    let sum = 0
    for (let i = 0; i < vector.length; i++) {
        sum += vector[i] * vector[i]
    }
    return Math.sqrt(sum)
}
