"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genaiscriptDebug = genaiscriptDebug;
const debug_1 = __importDefault(require("debug"));
const _genaiscriptDebug = (0, debug_1.default)("genaiscript");
function genaiscriptDebug(namespace) {
    return _genaiscriptDebug.extend(namespace);
}
//# sourceMappingURL=debug.js.map