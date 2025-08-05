/**
 * Marks a specific point in the application's performance timeline.
 *
 * @param id - The unique identifier for the performance mark.
 */
export declare function mark(id: string): void;
/**
 * Measures the duration between two performance marks.
 *
 * @param id - A unique identifier for the performance measurement.
 * @param detail - Optional string providing additional details for the measurement.
 * @returns A function to mark the end of the measurement and calculate the duration.
 *
 * The returned function accepts:
 * @param endDetail - Optional string with additional details for the end mark.
 * @returns The duration between the start and end marks in milliseconds.
 */
export declare function measure(id: string, detail?: string): (endDetail?: string) => number;
/**
 * Observes and logs performance measurements for the application.
 * Aggregates and outputs the total time and incremental durations
 * for each performance entry as they are recorded.
 *
 * Parameters:
 *   None.
 *
 * Behavior:
 * - Initializes an observer to listen for "measure" performance events.
 * - Logs the duration of each measurement and its cumulative total using `logVerbose`.
 */
export declare function logPerformance(): void;
//# sourceMappingURL=performance.d.ts.map