// Import necessary functions from the "@tidyjs/tidy" library
import {
    tidy,
    sliceTail,
    sliceHead,
    sliceSample,
    select,
    distinct,
} from "@tidyjs/tidy"

// JSDoc comment for the tidyData function
/**
 * Processes and filters data rows based on the provided options.
 * 
 * This function applies various operations such as selecting distinct values,
 * selecting specific headers, and slicing samples, head, or tail of the data.
 * 
 * @param {object[]} rows - The data rows to be processed.
 * @param {DataFilter} [options={}] - The options to filter and manipulate the data.
 * @returns {object[]} - The processed and filtered data rows.
 */
export function tidyData(rows: object[], options: DataFilter = {}) {
    // Check if distinct operation is specified in options and apply it
    if (options.distinct?.length)
        rows = tidy(rows, distinct(options.distinct as any))

    // Check if specific headers need to be selected and apply the selection
    if (options.headers?.length) rows = tidy(rows, select(options.headers))
    
    // Check if a random sample of rows is to be sliced and apply sampling
    if (options.sliceSample > 0)
        rows = tidy(rows, sliceSample(options.sliceSample))

    // Check if the head of rows is to be sliced and apply slicing
    if (options.sliceHead > 0) rows = tidy(rows, sliceHead(options.sliceHead))

    // Check if the tail of rows is to be sliced and apply slicing
    if (options.sliceTail > 0) rows = tidy(rows, sliceTail(options.sliceTail))

    // Return the processed rows after applying all specified operations
    return rows
}
