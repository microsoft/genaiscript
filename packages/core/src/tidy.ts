// Import necessary functions from the "@tidyjs/tidy" library
import {
    tidy,
    sliceTail,
    sliceHead,
    sliceSample,
    select,
    distinct,
    arrange,
    asc,
} from "@tidyjs/tidy"
import { arrayify } from "./util"

export function sliceData(rows: any[], options: DataFilter = {}) {
    if (!rows) return rows

    // Check if a random sample of rows is to be sliced and apply sampling
    if (options.sliceSample > 0)
        rows = tidy(rows, sliceSample(options.sliceSample))

    // Check if the head of rows is to be sliced and apply slicing
    if (options.sliceHead > 0) rows = tidy(rows, sliceHead(options.sliceHead))

    // Check if the tail of rows is to be sliced and apply slicing
    if (options.sliceTail > 0) rows = tidy(rows, sliceTail(options.sliceTail))

    return rows
}

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
    const ds = arrayify(options.distinct)
    if (ds.length) rows = tidy(rows, distinct(ds as any))

    // Check if specific headers need to be selected and apply the selection
    const headers = arrayify(options.headers)
    if (headers.length) rows = tidy(rows, select(headers))

    // slicing
    rows = sliceData(rows, options)

    const sorts = arrayify(options.sort)
    if (sorts) rows = tidy(rows, arrange(sorts))
    // Return the processed rows after applying all specified operations
    return rows
}
