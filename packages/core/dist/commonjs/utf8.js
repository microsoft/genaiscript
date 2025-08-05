"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUTF8Decoder = createUTF8Decoder;
exports.createUTF8Encoder = createUTF8Encoder;
exports.utf8Encode = utf8Encode;
exports.utf8Decode = utf8Decode;
function createUTF8Decoder() {
    return new TextDecoder("utf-8");
}
function createUTF8Encoder() {
    return new TextEncoder();
}
/**
 * Encodes a given string into a UTF-8 encoded byte sequence.
 *
 * @param s - The string to be encoded.
 * @returns A Uint8Array containing the UTF-8 encoded byte sequence of the input string.
 */
function utf8Encode(s) {
    return createUTF8Encoder().encode(s);
}
/**
 * Decodes a UTF-8 encoded buffer into a string.
 *
 * @param buf - The buffer containing UTF-8 encoded data to decode.
 * @returns Decoded string representation of the buffer.
 */
function utf8Decode(buf) {
    return createUTF8Decoder().decode(buf);
}
//# sourceMappingURL=utf8.js.map