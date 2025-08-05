"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLogFormat = consoleLogFormat;
const object_inspect_1 = __importDefault(require("object-inspect"));
/**
 * Formats an array of arguments into a single string for logging purposes.
 *
 * @param args - The arguments to format. Can include values of various types:
 *   - Primitive types (number, bigint, string, boolean, undefined).
 *   - Symbols, which are converted to their string representation.
 *   - Objects or functions, which are serialized using a custom inspection method.
 *
 * @returns A string representation of the input arguments.
 */
function consoleLogFormat(...args) {
    let line = "";
    for (let i = 0; i < args.length; ++i) {
        if (i > 0)
            line += " ";
        const a = args[i];
        switch (typeof a) {
            case "bigint":
            case "number":
            case "boolean":
            case "undefined":
                line += a;
                break;
            case "string":
                line += a;
                break;
            case "symbol":
                line += a.toString();
                break;
            case "object":
            case "function":
                line += (0, object_inspect_1.default)(a, {
                    indent: 2,
                    depth: 4,
                    maxStringLength: 2048,
                });
                break;
        }
    }
    return line;
}
//# sourceMappingURL=logging.js.map