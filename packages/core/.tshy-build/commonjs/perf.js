"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMeasure = logMeasure;
/**
 * Logs the duration of a performance measurement between two marks.
 *
 * @param name - The name of the measurement.
 * @param start - The name of the starting performance mark.
 * @param end - The name of the ending performance mark.
 */
function logMeasure(name, start, end) {
    performance.mark(end);
    const m = performance.measure(name, start, end);
    console.debug(`⏲️ ${m.name}: ${m.duration | 0}ms`);
}
//# sourceMappingURL=perf.js.map