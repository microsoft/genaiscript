"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCI = exports.ci = void 0;
const ci_info_1 = __importDefault(require("ci-info"));
exports.ci = ci_info_1.default;
exports.isCI = ci_info_1.default.isCI;
//# sourceMappingURL=ci.js.map