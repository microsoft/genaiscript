"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromBase64 = fromBase64;
exports.toBase64 = toBase64;
/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 - The base64 encoded string.
 * @returns Uint8Array of decoded bytes.
 */
function fromBase64(base64) {
    // Basic base64 validation
    if (typeof base64 !== "string" || !/^[A-Za-z0-9+/=\s]+$/.test(base64)) {
        throw new Error("Input is not a valid base64 string");
    }
    return new Uint8Array(Buffer.from(base64, "base64"));
}
/**
 * Encodes a string or Uint8Array into a base64 string.
 * @param input - The string or Uint8Array to encode.
 * @returns Base64 encoded string.
 */
function toBase64(input) {
    let bytes;
    if (typeof input === "string") {
        bytes = Buffer.from(input, "utf-8");
    }
    else {
        bytes = input;
    }
    return Buffer.from(bytes).toString("base64");
}
//# sourceMappingURL=base64.js.map