import {
    tidy,
    sliceTail,
    sliceHead,
    sliceSample,
    select,
    distinct,
} from "@tidyjs/tidy"

export function tidyData(rows: object[], options: DefDataOptions) {
    if (options.distinct?.length)
        rows = tidy(rows, distinct(options.distinct as any))
    if (options.headers?.length) rows = tidy(rows, select(options.headers))
    if (options.sliceSample > 0)
        rows = tidy(rows, sliceSample(options.sliceSample))
    if (options.sliceHead > 0) rows = tidy(rows, sliceHead(options.sliceHead))
    if (options.sliceSample > 0) rows = tidy(rows, sliceTail(options.sliceTail))
    return rows
}
