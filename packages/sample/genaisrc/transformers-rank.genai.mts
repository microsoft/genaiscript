script({
    files: "src/rag/*"
})

import { pipeline, cos_sim } from '@huggingface/transformers';

const featureExtractor = await pipeline('feature-extraction');

// Function to rank documents
async function rank(query: string, files: WorkspaceFile[]) {
    const documents = files.map(({ content }) => content);
    const queryEmbedding = (await featureExtractor(query)).tolist()[0][0]
    const similarities = await Promise.all(documents.map(async (doc, i) => {
        const docEmbedding = (await featureExtractor(doc)).tolist()[0][0]
        const score = cos_sim(queryEmbedding, docEmbedding);
        return { file: files[i], score };
    }));
    similarities.sort((a, b) => b.score - a.score);
    return similarities
}

// Example usage
const query = "What is markdown?";
const rankedDocs = await rank(query, env.files)
console.log(rankedDocs)