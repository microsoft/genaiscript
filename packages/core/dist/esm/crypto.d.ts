/**
 * Generates a random hexadecimal string of the specified size.
 *
 * @param size - Number of random bytes to generate.
 * @returns Hexadecimal string representation of the random bytes.
 */
export declare function randomHex(size: number): string;
/**
 * Computes a hash of the given value with optional configurations.
 *
 * @param value - The input data to hash. Can be strings, numbers, booleans, arrays, objects, or other compatible types.
 * @param options - Additional options for hashing.
 *    - algorithm - Hashing algorithm to use. Defaults to "sha-256".
 *    - version - If true, includes the core version string in the hash.
 *    - length - If specified, truncates the resulting hash string to this length.
 *    - salt - Optional salt to prepend to the hashed value.
 *    - readWorkspaceFiles - If true, enables reading file workspace content for hash calculation in special cases where `filename` is specified.
 *    - ...rest - Any remaining properties are included in the hash computation.
 * @returns A promise resolving to the computed hash as a hexadecimal string.
 */
export declare function hash(value: any, options?: HashOptions): Promise<string>;
/**
 * Computes the hash of a file using a streaming approach.
 *
 * @param filePath - Path to the file to hash.
 * @param algorithm - Hashing algorithm to use. Defaults to "sha-256".
 * @returns Promise resolving to the file's hash in hexadecimal format.
 */
export declare function hashFile(filePath: string, algorithm?: string): Promise<string>;
//# sourceMappingURL=crypto.d.ts.map
