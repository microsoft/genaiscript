// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { toBase64 as _toBase64, fromBase64 as _fromBase64 } from "@jsonjoy.com/base64";

/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 - The base64 encoded string.
 * @returns Uint8Array of decoded bytes.
 */
export function fromBase64(base64: string): Uint8Array {
  // Basic base64 validation
  if (typeof base64 !== "string" || !/^[A-Za-z0-9+/=\s]+$/.test(base64)) {
    throw new Error("Input is not a valid base64 string");
  }
  return _fromBase64(base64);
}

/**
 * Encodes a string or Uint8Array into a base64 string.
 * @param input - The string or Uint8Array to encode.
 * @returns Base64 encoded string.
 */
export function toBase64(input: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = Buffer.from(input, "utf-8");
  } else {
    bytes = input;
  }
  return _toBase64(bytes);
}
