script({
    files: "src/rag/*"
})

import { pipeline, cos_sim } from '@xenova/transformers';

const featureExtractor = await pipeline('feature-extraction');

// Function to rank documents
async function rank(query: string, files: WorkspaceFile[]) {
    const documents = files.map(({ content }) => content);
    // Extract features for the query
    const queryEmbedding = (await featureExtractor(query)).tolist()[0][0]
    console.log(queryEmbedding)
    // Extract features for each document and compute similarity
    const similarities = await Promise.all(documents.map(async (doc, i) => {
        const docEmbedding = (await featureExtractor(doc)).tolist()[0][0]
        const score = cos_sim(queryEmbedding, docEmbedding);
        return { file: files[i], score };
    }));

    // Sort documents by similarity score in descending order
    similarities.sort((a, b) => b.score - a.score);

    return similarities
}

// Example usage
const query = "What is markdown?";
const rankedDocs = await rank(query, env.files)
console.log(rankedDocs)