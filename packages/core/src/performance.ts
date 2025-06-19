import { performance, PerformanceObserver } from "perf_hooks";
import { logVerbose, toStringList } from "./util";
import prettyMilliseconds from "pretty-ms";

/**
 * Marks a specific point in the application's performance timeline.
 *
 * @param id - The unique identifier for the performance mark.
 */
export function mark(id: string) {
  performance.mark(id);
}

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
export function measure(id: string, detail?: string) {
  const start = id + ".start";
  const end = id + ".end";
  const startm = performance.mark(start);
  return (endDetail?: string) => {
    const endm = performance.mark(end);
    performance.measure(`${id} ${toStringList(detail, endDetail)}`, start, end);
    return endm.startTime - startm.startTime;
  };
}

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
export function logPerformance() {
  const measures: Record<string, number> = {};
  const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      const total = (measures[entry.name] || 0) + entry.duration;
      measures[entry.name] = total;
      logVerbose(
        `perf> ${entry.name} ${prettyMilliseconds(entry.duration)}/${prettyMilliseconds(total)}`,
      );
    });
  });
  perfObserver.observe({ entryTypes: ["measure"], buffered: true });
}
