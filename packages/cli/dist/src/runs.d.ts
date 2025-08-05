/**
 * Collects information about available runs based on the provided options.
 *
 * @param options - Optional filters for collecting runs.
 *   - scriptid - Filters the runs to only include those associated with the specified script ID.
 *
 * @returns An array of run objects containing:
 *   - scriptId: The ID of the associated script.
 *   - name: The run's name.
 *   - runId: The unique identifier for the run.
 *   - dir: The directory path of the run.
 *   - creationTme: The creation time of the run, parsed from its name.
 *   - report: The size of the `res.json` file in the run, or 0 if it does not exist.
 *   - trace: The size of the `trace.md` file in the run, or 0 if it does not exist.
 */
export declare function collectRuns(options?: {
    scriptid?: string;
}): Promise<{
    scriptId: string;
    name: string;
    runId: string;
    dir: string;
    creationTme: string;
    report: number;
    trace: number;
}[]>;
/**
 * Resolves the directory path for a specific run of a script.
 *
 * @param scriptId - The identifier of the script.
 * @param runId - The identifier of the run.
 * @returns The file path to the directory containing the run's data.
 */
export declare function resolveRunDir(scriptId: string, runId: string): string;
/**
 * Lists all runs grouped by script ID and logs them to the console.
 *
 * @param options - Optional configuration object.
 * @param options.scriptid - Filter to list runs only for the specified script ID.
 *
 * This function retrieves and organizes runs into groups based on their script ID.
 * Each run is displayed with its run ID, name, and a URL leading to detailed information.
 */
export declare function listRuns(options?: {
    scriptid?: string;
}): Promise<void>;
//# sourceMappingURL=runs.d.ts.map