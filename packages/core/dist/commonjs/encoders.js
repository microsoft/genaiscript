"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTokenEncoder = resolveTokenEncoder;
exports.chunk = chunk;
// Import the function to parse model identifiers
const models_js_1 = require("./models.js");
const host_js_1 = require("./host.js");
const node_path_1 = __importDefault(require("node:path"));
const liner_js_1 = require("./liner.js");
const file_js_1 = require("./file.js");
const assert_js_1 = require("./assert.js");
const textsplitter_js_1 = require("./textsplitter.js");
const gpt_4o_1 = __importStar(require("gpt-tokenizer/model/gpt-4o"));
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("encoders");
/**
 * Resolves the token encoder for a specified model identifier.
 * @param modelId - The model identifier to resolve the encoder for. Defaults to a large model alias if not provided.
 * @param options - Optional configuration. Includes a flag to disable fallback mechanisms.
 * @returns A Promise resolving to a Tokenizer object or undefined if fallback is disabled and resolution fails.
 */
async function resolveTokenEncoder(modelId, options) {
    const { disableFallback } = options || {};
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    // Parse the model identifier to extract the model information
    if (!modelId) {
        dbg(`modelId is empty, using default model alias`);
        modelId = runtimeHost.modelAliases.large.model;
    }
    let { model } = (0, models_js_1.parseModelIdentifier)(modelId);
    if (/^gpt-4.1/i.test(model))
        model = "gpt-4o"; // same encoding
    const module = model.toLowerCase(); // Assign model to module for dynamic import path
    const { modelEncodings } = runtimeHost?.config || {};
    const encoding = modelEncodings?.[modelId] || module;
    const encoderOptions = {
        disallowedSpecial: new Set(),
    };
    try {
        // Attempt to dynamically import the encoder module for the specified model
        const { encode, decode, default: api } = await import(`gpt-tokenizer/model/${encoding}`);
        (0, assert_js_1.assert)(!!encode);
        const { modelName } = api;
        const size = api.bytePairEncodingCoreProcessor?.mergeableBytePairRankCount +
            (api.bytePairEncodingCoreProcessor?.specialTokenMapping?.size || 0);
        return Object.freeze({
            model: modelName,
            size,
            encode: (line) => encode(line, encoderOptions), // Return the default encoder function
            decode,
        });
    }
    catch {
        if (disableFallback) {
            dbg(`encoder fallback disabled for ${encoding}`);
            return undefined;
        }
        (0, assert_js_1.assert)(!!gpt_4o_1.encode);
        const { modelName, vocabularySize } = gpt_4o_1.default;
        dbg(`fallback ${encoding} to gpt-4o encoder`);
        return Object.freeze({
            model: modelName,
            size: vocabularySize,
            encode: (line) => (0, gpt_4o_1.encode)(line, encoderOptions), // Return the default encoder function
            decode: // Return the default encoder function
            gpt_4o_1.decode,
        });
    }
}
/**
 * Splits the content of a file or string into manageable chunks based on the provided configuration.
 *
 * @param file - The content to be chunked; can be a string or a workspace file object.
 *               If a workspace file, its content is resolved and processed.
 * @param options - Optional configuration for chunk generation.
 *                  - model: Model identifier used to resolve the tokenizer.
 *                  - docType: Document type for processing; inferred from the file extension if not provided.
 *                  - lineNumbers: Flag indicating whether to include line numbers in the output.
 *                  - Other properties are passed to the TextSplitter for customization.
 * @returns A Promise resolving to an array of text chunks. Each chunk includes content, filename, and start/end line numbers.
 */
async function chunk(file, options) {
    const f = await file;
    let filename;
    let content;
    if (typeof f === "string") {
        content = f;
    }
    else if (typeof f === "object") {
        await (0, file_js_1.resolveFileContent)(f);
        if (f.encoding) {
            dbg(`binary file detected, skip`);
            return [];
        } // binary file bail out
        filename = f.filename;
        content = f.content;
    }
    else {
        return [];
    }
    const { model, docType: optionsDocType, lineNumbers, ...rest } = options || {};
    const docType = (optionsDocType || (filename ? node_path_1.default.extname(filename) : undefined))
        ?.toLowerCase()
        ?.replace(/^\./, "");
    const tokenizer = await resolveTokenEncoder(model);
    const ts = new textsplitter_js_1.TextSplitter({
        ...rest,
        docType,
        tokenizer,
        keepSeparators: true,
    });
    const chunksRaw = ts.split(content);
    const chunks = chunksRaw.map(({ text, startPos, endPos }) => {
        const lineStart = (0, liner_js_1.indexToLineNumber)(content, startPos);
        const lineEnd = (0, liner_js_1.indexToLineNumber)(content, endPos);
        if (lineNumbers) {
            text = (0, liner_js_1.addLineNumbers)(text, { startLine: lineStart });
        }
        return {
            content: text,
            filename,
            lineStart,
            lineEnd,
        };
    });
    dbg(`chunks ${chunks.length}`);
    return chunks;
}
//# sourceMappingURL=encoders.js.map