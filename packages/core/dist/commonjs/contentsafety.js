"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePromptInjectionDetector = resolvePromptInjectionDetector;
exports.resolveContentSafety = resolveContentSafety;
const debug_js_1 = require("./debug.js");
const host_js_1 = require("./host.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("contentsafety");
async function resolvePromptInjectionDetector(safetyOptions, options) {
    const services = await resolveContentSafety(safetyOptions, options);
    return services?.detectPromptInjection;
}
async function resolveContentSafety(safetyOptions, options) {
    const { contentSafety, detectPromptInjection } = safetyOptions || {};
    if (!detectPromptInjection) {
        return {};
    }
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    dbg(`resolving %s`, contentSafety);
    const services = await runtimeHost.contentSafety(contentSafety, options);
    if (!services && (detectPromptInjection === true || detectPromptInjection === "always"))
        throw new Error("Content safety provider not available or not configured.");
    dbg(`resolved %s`, services?.id);
    return services;
}
//# sourceMappingURL=contentsafety.js.map