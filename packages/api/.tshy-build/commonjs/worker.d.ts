/**
 * Handles worker thread execution based on the provided data type.
 *
 * Parameters:
 *     - type: Specifies the type of operation to execute. For now, supports "run".
 *     - scriptId: Identifier of the script to be executed (provided when type is "run").
 *     - files: List of file paths required for script execution (provided when type is "run").
 *     - options: Additional configuration options for script execution (provided when type is "run").
 *
 * Notes:
 *     - Redirects stdout to stderr.
 *     - Installs NodeHost with environment options.
 *     - Handles resource change events and communicates them to the parent thread.
 */
export declare function worker(): Promise<void>;
//# sourceMappingURL=worker.d.ts.map