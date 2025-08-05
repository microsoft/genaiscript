"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelError = void 0;
/**
 * This module defines TypeScript types and interfaces for chat completions using the OpenAI API.
 * These types represent structured data for various chat-related functionalities.
 *
 * Tags: TypeScript, OpenAI, Chat, Types, Interfaces
 */
const openai_1 = __importDefault(require("openai"));
// Alias for OpenAI's API error type
exports.ModelError = openai_1.default.APIError;
//# sourceMappingURL=chattypes.js.map