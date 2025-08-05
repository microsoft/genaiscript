"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveChatGenerationContext = resolveChatGenerationContext;
function resolveChatGenerationContext(options) {
    const { generator: ctx } = options || {};
    if (ctx)
        return ctx;
    const globalPromptContext = globalThis;
    const generator = globalPromptContext.env?.generator;
    if (!generator)
        throw new Error("You must pass a chat generation context when using the runtime.");
    return generator;
}
//# sourceMappingURL=plugin.js.map