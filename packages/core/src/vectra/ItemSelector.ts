import { MetadataFilter, MetadataTypes } from "./types"

export class ItemSelector {
    /**
     * Returns the similarity between two vectors using the cosine similarity.
     * @param vector1 Vector 1
     * @param vector2 Vector 2
     * @returns Similarity between the two vectors
     */
    public static cosineSimilarity(vector1: number[], vector2: number[]) {
        // Return the quotient of the dot product and the product of the norms
        return (
            this.dotProduct(vector1, vector2) /
            (this.normalize(vector1) * this.normalize(vector2))
        )
    }

    /**
     * Normalizes a vector.
     * @remarks
     * The norm of a vector is the square root of the sum of the squares of the elements.
     * The LocalIndex pre-normalizes all vectors to improve performance.
     * @param vector Vector to normalize
     * @returns Normalized vector
     */
    public static normalize(vector: number[]) {
        // Initialize a variable to store the sum of the squares
        let sum = 0
        // Loop through the elements of the array
        for (let i = 0; i < vector.length; i++) {
            // Square the element and add it to the sum
            sum += vector[i] * vector[i]
        }
        // Return the square root of the sum
        return Math.sqrt(sum)
    }

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
    public static normalizedCosineSimilarity(
        vector1: number[],
        norm1: number,
        vector2: number[],
        norm2: number
    ) {
        // Return the quotient of the dot product and the product of the norms
        return this.dotProduct(vector1, vector2) / (norm1 * norm2)
    }

    /**
     * Applies a filter to the metadata of an item.
     * @param metadata Metadata of the item
     * @param filter Filter to apply
     * @returns True if the item matches the filter, false otherwise
     */
    public static select(
        metadata: Record<string, MetadataTypes>,
        filter: MetadataFilter
    ): boolean {
        if (filter === undefined || filter === null) {
            return true
        }

        for (const key in filter) {
            switch (key) {
                case "$and":
                    if (
                        !filter[key]!.every((f: MetadataFilter) =>
                            this.select(metadata, f)
                        )
                    ) {
                        return false
                    }
                    break
                case "$or":
                    if (
                        !filter[key]!.some((f: MetadataFilter) =>
                            this.select(metadata, f)
                        )
                    ) {
                        return false
                    }
                    break
                default:
                    const value = filter[key]
                    if (value === undefined || value === null) {
                        return false
                    } else if (typeof value == "object") {
                        if (
                            !this.metadataFilter(
                                metadata[key],
                                value as MetadataFilter
                            )
                        ) {
                            return false
                        }
                    } else {
                        if (metadata[key] !== value) {
                            return false
                        }
                    }
                    break
            }
        }
        return true
    }

    private static dotProduct(arr1: number[], arr2: number[]) {
        // Initialize a variable to store the sum of the products
        let sum = 0
        // Loop through the elements of the arrays
        for (let i = 0; i < arr1.length; i++) {
            // Multiply the corresponding elements and add them to the sum
            sum += arr1[i] * arr2[i]
        }
        // Return the sum
        return sum
    }

    private static metadataFilter(
        value: MetadataTypes,
        filter: MetadataFilter
    ): boolean {
        if (value === undefined || value === null) {
            return false
        }

        for (const key in filter) {
            switch (key) {
                case "$eq":
                    if (value !== filter[key]) {
                        return false
                    }
                    break
                case "$ne":
                    if (value === filter[key]) {
                        return false
                    }
                    break
                case "$gt":
                    if (typeof value != "number" || value <= filter[key]!) {
                        return false
                    }
                    break
                case "$gte":
                    if (typeof value != "number" || value < filter[key]!) {
                        return false
                    }
                    break
                case "$lt":
                    if (typeof value != "number" || value >= filter[key]!) {
                        return false
                    }
                    break
                case "$lte":
                    if (typeof value != "number" || value > filter[key]!) {
                        return false
                    }
                    break
                case "$in":
                    if (typeof value == "boolean") {
                        return false
                    } else if (
                        typeof value == "string" &&
                        !filter[key]!.includes(value)
                    ) {
                        return false
                    } else if (
                        !filter[key]!.some(
                            (val) =>
                                typeof val == "string" &&
                                val.includes(value as string)
                        )
                    ) {
                        return false
                    }
                    break
                case "$nin":
                    if (typeof value == "boolean") {
                        return false
                    } else if (
                        typeof value == "string" &&
                        filter[key]!.includes(value)
                    ) {
                        return false
                    } else if (
                        filter[key]!.some(
                            (val) =>
                                typeof val == "string" &&
                                val.includes(value as string)
                        )
                    ) {
                        return false
                    }
                    break
                default:
                    return value === filter[key]
            }
        }
        return true
    }
}
