"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliceData = sliceData;
exports.tidyData = tidyData;
// Import necessary functions from the "@tidyjs/tidy" library
const tidy_1 = require("@tidyjs/tidy");
const cleaners_js_1 = require("./cleaners.js");
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
function sliceData(rows, options = {}) {
    if (!rows)
        return rows;
    // Check if a random sample of rows is to be sliced and apply sampling
    if (options.sliceSample > 0)
        rows = (0, tidy_1.tidy)(rows, (0, tidy_1.sliceSample)(options.sliceSample));
    // Check if the head of rows is to be sliced and apply slicing
    if (options.sliceHead > 0)
        rows = (0, tidy_1.tidy)(rows, (0, tidy_1.sliceHead)(options.sliceHead));
    // Check if the tail of rows is to be sliced and apply slicing
    if (options.sliceTail > 0)
        rows = (0, tidy_1.tidy)(rows, (0, tidy_1.sliceTail)(options.sliceTail));
    return rows;
}
// JSDoc comment for the tidyData function
/**
 * Processes and filters data rows based on the provided options.
 *
 * This function applies operations such as selecting distinct values, selecting specific headers, slicing samples, head, or tail of the data, and sorting rows.
 *
 * @param rows - The data rows to be processed.
 * @param options - The options to filter, slice, and sort the data. Includes distinct, headers, sliceSample, sliceHead, sliceTail, and sort.
 * @returns - The processed and filtered data rows.
 */
function tidyData(rows, options = {}) {
    // Check if distinct operation is specified in options and apply it
    const ds = (0, cleaners_js_1.arrayify)(options.distinct);
    if (ds.length)
        rows = (0, tidy_1.tidy)(rows, (0, tidy_1.distinct)(ds));
    // Check if specific headers need to be selected and apply the selection
    const headers = (0, cleaners_js_1.arrayify)(options.headers);
    if (headers.length)
        rows = (0, tidy_1.tidy)(rows, (0, tidy_1.select)(headers));
    // slicing
    rows = sliceData(rows, options);
    const sorts = (0, cleaners_js_1.arrayify)(options.sort);
    if (sorts)
        rows = (0, tidy_1.tidy)(rows, (0, tidy_1.arrange)(sorts));
    // Return the processed rows after applying all specified operations
    return rows;
}
//# sourceMappingURL=tidy.js.map