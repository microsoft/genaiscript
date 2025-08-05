"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLEscape = void 0;
// This module provides functions to convert HTML content into different formats such as JSON, plain text, and Markdown.
// It imports necessary libraries for HTML conversion and logging purposes.
/// <reference path="./html-escaper.d.ts" />
const html_escaper_1 = require("html-escaper");
exports.HTMLEscape = html_escaper_1.escape;
//# sourceMappingURL=htmlescape.js.map