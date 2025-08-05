"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoneModel = void 0;
const constants_js_1 = require("./constants.js");
const error_js_1 = require("./error.js");
exports.NoneModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_NONE,
    completer: async (_req, _connection, _options) => {
        return {
            finishReason: "fail",
            error: (0, error_js_1.serializeError)("No LLM execution allowed in this context."),
        };
    },
});
//# sourceMappingURL=nonemodel.js.map