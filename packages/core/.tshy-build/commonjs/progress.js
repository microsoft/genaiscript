"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Progress = void 0;
/**
 * Defines a generalized way of reporting progress updates.
 */
class Progress {
    start(message, count) {
        this.report({ message, count });
    }
    succeed(message) {
        this.report({ message: message || "", succeeded: true });
    }
    fail(message) {
        this.report({ message: message || "", succeeded: false });
    }
    stop() { }
}
exports.Progress = Progress;
//# sourceMappingURL=progress.js.map