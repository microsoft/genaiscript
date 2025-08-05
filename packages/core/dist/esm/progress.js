// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Defines a generalized way of reporting progress updates.
 */
export class Progress {
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
//# sourceMappingURL=progress.js.map