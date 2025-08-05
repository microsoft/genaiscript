import type { DataFilter, ArrayFilter } from "./types.js";
/**
 * Slices data rows based on provided options for sampling, head, and tail operations.
 *
 * @param rows - The array of data rows to process. Returns the original array if null or undefined.
 * @param options - The filtering criteria:
 *    - sliceSample: The number of random rows to sample and return.
 *    - sliceHead: The number of rows to select from the start.
 *    - sliceTail: The number of rows to select from the end.
 * @returns - The sliced data rows after applying the specified criteria.
 */
export declare function sliceData(rows: any[], options?: ArrayFilter): any[];
/**
 * Processes and filters data rows based on the provided options.
 *
 * This function applies operations such as selecting distinct values, selecting specific headers, slicing samples, head, or tail of the data, and sorting rows.
 *
 * @param rows - The data rows to be processed.
 * @param options - The options to filter, slice, and sort the data. Includes distinct, headers, sliceSample, sliceHead, sliceTail, and sort.
 * @returns - The processed and filtered data rows.
 */
export declare function tidyData(rows: object[], options?: DataFilter): object[];
//# sourceMappingURL=tidy.d.ts.map