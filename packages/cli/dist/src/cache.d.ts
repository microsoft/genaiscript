/**
 * This module provides a function to clear a specified cache directory.
 */
/**
 * Asynchronously clears the specified cache directory.
 *
 * This function removes all contents within the cache directory. If the 'name'
 * parameter is 'tests', it specifically targets and clears a subdirectory named 'tests'
 * within the cache directory.
 *
 * @param name - The name of the subdirectory to clear.
 *               If 'tests', it targets a specific subdirectory within the cache.
 */
export declare function cacheClear(name: string): Promise<void>;
//# sourceMappingURL=cache.d.ts.map