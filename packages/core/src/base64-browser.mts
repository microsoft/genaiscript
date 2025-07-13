// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Decodes a base64 string into a Uint8Array (browser-compatible).
 * @param base64 - The base64 encoded string.
 * @returns Uint8Array of decoded bytes.
 */
export function fromBase64(base64: string): Uint8Array {
  if (typeof base64 !== "string" || !/^[A-Za-z0-9+/=\s]+$/.test(base64)) {
    throw new Error("Input is not a valid base64 string");
  }
  const cleaned = base64.replace(/\s/g, "");
  const binary = atob(cleaned);
  // Use spread to convert string to array of char codes
  return new Uint8Array([...binary].map(char => char.charCodeAt(0)));
}

/**
 * Encodes a string or Uint8Array into a base64 string (browser-compatible).
 * @param input - The string or Uint8Array to encode.
 * @returns Base64 encoded string.
 */
export function toBase64(input: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = input;
  }
  // Use spread to convert Uint8Array to string
  return btoa(String.fromCharCode(...bytes));
}
