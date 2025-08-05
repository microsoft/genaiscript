import type { UTF8Decoder, UTF8Encoder } from "./host.js";
export declare function createUTF8Decoder(): UTF8Decoder;
export declare function createUTF8Encoder(): UTF8Encoder;
/**
 * Encodes a given string into a UTF-8 encoded byte sequence.
 *
 * @param s - The string to be encoded.
 * @returns A Uint8Array containing the UTF-8 encoded byte sequence of the input string.
 */
export declare function utf8Encode(s: string): Uint8Array<ArrayBufferLike>;
/**
 * Decodes a UTF-8 encoded buffer into a string.
 *
 * @param buf - The buffer containing UTF-8 encoded data to decode.
 * @returns Decoded string representation of the buffer.
 */
export declare function utf8Decode(buf: Uint8Array): string;
//# sourceMappingURL=utf8.d.ts.map