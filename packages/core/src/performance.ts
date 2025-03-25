import { performance, PerformanceObserver } from "perf_hooks"
import { logVerbose, toStringList } from "./util"
import prettyMilliseconds from "pretty-ms"

/**
 * Records a performance mark with the specified identifier.
 * This mark can be used as a reference point for measuring 
 * the duration of operations in the performance API.
 *
 * @param id - The identifier for the performance mark.
 */
export function mark(id: string) {
    performance.mark(id)
}

/**
 * Measures the execution time of a section of code.
 * 
 * Marks the start of a measurement with a unique identifier. 
 * Returns a function that, when called, marks the end of the measurement, 
 * records the duration, and provides the time elapsed between the start 
 * and end marks.
 * 
 * @param id - Unique identifier for the measurement.
 * @param detail - Optional detail string to further describe the measurement.
 * 
 * @returns A function that, when called, marks the end of the measurement 
 * and returns the duration of the measured section in milliseconds.
 */
export function measure(id: string, detail?: string) {
    const start = id + ".start"
    const end = id + ".end"
    const startm = performance.mark(start)
    return (endDetail?: string) => {
        const endm = performance.mark(end)
        performance.measure(
            `${id} ${toStringList(detail, endDetail)}`,
            start,
            end
        )
        return endm.startTime - startm.startTime
    }
}

/**
 * Logs performance metrics for measured operations.
 * Observes performance entries and aggregates their durations.
 * Outputs log messages for each performance measure, including 
 * the duration of the measure and the cumulative total.
 */
export function logPerformance() {
    const measures: Record<string, number> = {}
    const perfObserver = new PerformanceObserver((items) => {
        items.getEntries().forEach((entry) => {
            const total = (measures[entry.name] || 0) + entry.duration
            measures[entry.name] = total
            logVerbose(
                `perf> ${entry.name} ${prettyMilliseconds(entry.duration)}/${prettyMilliseconds(total)}`
            )
        })
    })
    perfObserver.observe({ entryTypes: ["measure"], buffered: true })
}
