import type { UTF8Decoder, UTF8Encoder } from "./host.js";

export function createUTF8Decoder(): UTF8Decoder {
  return new TextDecoder("utf-8");
}
export function createUTF8Encoder(): UTF8Encoder {
  return new TextEncoder();
}

/**
 * Encodes a given string into a UTF-8 encoded byte sequence.
 *
 * @param s - The string to be encoded.
 * @returns A Uint8Array containing the UTF-8 encoded byte sequence of the input string.
 */
export function utf8Encode(s: string) {
  return createUTF8Encoder().encode(s);
}

/**
 * Decodes a UTF-8 encoded buffer into a string.
 *
 * @param buf - The buffer containing UTF-8 encoded data to decode.
 * @returns Decoded string representation of the buffer.
 */
export function utf8Decode(buf: Uint8Array) {
  return createUTF8Decoder().decode(buf);
}
