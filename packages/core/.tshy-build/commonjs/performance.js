"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mark = mark;
exports.measure = measure;
exports.logPerformance = logPerformance;
const node_perf_hooks_1 = require("node:perf_hooks");
const util_js_1 = require("./util.js");
const pretty_ms_1 = __importDefault(require("pretty-ms"));
/**
 * Marks a specific point in the application's performance timeline.
 *
 * @param id - The unique identifier for the performance mark.
 */
function mark(id) {
    node_perf_hooks_1.performance.mark(id);
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
function measure(id, detail) {
    const start = id + ".start";
    const end = id + ".end";
    const startm = node_perf_hooks_1.performance.mark(start);
    return (endDetail) => {
        const endm = node_perf_hooks_1.performance.mark(end);
        node_perf_hooks_1.performance.measure(`${id} ${(0, util_js_1.toStringList)(detail, endDetail)}`, start, end);
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
function logPerformance() {
    const measures = {};
    const perfObserver = new node_perf_hooks_1.PerformanceObserver((items) => {
        items.getEntries().forEach((entry) => {
            const total = (measures[entry.name] || 0) + entry.duration;
            measures[entry.name] = total;
            (0, util_js_1.logVerbose)(`perf> ${entry.name} ${(0, pretty_ms_1.default)(entry.duration)}/${(0, pretty_ms_1.default)(total)}`);
        });
    });
    perfObserver.observe({ entryTypes: ["measure"], buffered: true });
}
//# sourceMappingURL=performance.js.map