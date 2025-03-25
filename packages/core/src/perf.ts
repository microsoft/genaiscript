/**
 * Logs the performance measurement between two marks.
 *
 * This function marks the end time of a performance measure, calculates the duration
 * between the specified start and end marks, and logs the result in milliseconds to
 * the console.
 *
 * @param name - The name of the performance measure.
 * @param start - The name of the start mark.
 * @param end - The name of the end mark.
 */
export function logMeasure(name: string, start: string, end: string) {
    performance.mark(end)
    const m = performance.measure(name, start, end)
    console.debug(`⏲️ ${m.name}: ${m.duration | 0}ms`)
}
