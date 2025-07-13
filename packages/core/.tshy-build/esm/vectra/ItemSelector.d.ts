import { MetadataFilter, MetadataTypes } from "./types.js";
export declare class ItemSelector {
    /**
     * Returns the similarity between two vectors using the cosine similarity.
     * @param vector1 Vector 1
     * @param vector2 Vector 2
     * @returns Similarity between the two vectors
     */
    static cosineSimilarity(vector1: number[], vector2: number[]): number;
    /**
     * Normalizes a vector.
     * @remarks
     * The norm of a vector is the square root of the sum of the squares of the elements.
     * The LocalIndex pre-normalizes all vectors to improve performance.
     * @param vector Vector to normalize
     * @returns Normalized vector
     */
    static normalize(vector: number[]): number;
    /**
     * Returns the similarity between two vectors using cosine similarity.
     * @remarks
     * The LocalIndex pre-normalizes all vectors to improve performance.
     * This method uses the pre-calculated norms to improve performance.
     * @param vector1 Vector 1
     * @param norm1 Norm of vector 1
     * @param vector2 Vector 2
     * @param norm2 Norm of vector 2
     * @returns Similarity between the two vectors
     */
    static normalizedCosineSimilarity(vector1: number[], norm1: number, vector2: number[], norm2: number): number;
    /**
     * Applies a filter to the metadata of an item.
     * @param metadata Metadata of the item
     * @param filter Filter to apply
     * @returns True if the item matches the filter, false otherwise
     */
    static select(metadata: Record<string, MetadataTypes>, filter: MetadataFilter): boolean;
    private static dotProduct;
    private static metadataFilter;
}
//# sourceMappingURL=ItemSelector.d.ts.map