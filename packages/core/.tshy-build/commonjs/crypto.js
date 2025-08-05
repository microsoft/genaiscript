"use strict";
/* eslint-disable n/no-unsupported-features/node-builtins */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomHex = randomHex;
exports.hash = hash;
exports.hashFile = hashFile;
const node_crypto_1 = require("node:crypto");
const util_js_1 = require("./util.js");
const node_fs_1 = require("node:fs");
const version_js_1 = require("./version.js");
const utf8_js_1 = require("./utf8.js");
function getRandomValues(bytes) {
    if (globalThis.crypto) {
        return globalThis.crypto.getRandomValues(bytes);
    }
    else {
        return (0, node_crypto_1.getRandomValues)(bytes);
    }
}
async function digest(algorithm, data) {
    algorithm = algorithm.toUpperCase();
    if (globalThis.crypto) {
        return globalThis.crypto.subtle.digest(algorithm, data);
    }
    else {
        return node_crypto_1.subtle.digest(algorithm, data);
    }
}
/**
 * Generates a random hexadecimal string of the specified size.
 *
 * @param size - Number of random bytes to generate.
 * @returns Hexadecimal string representation of the random bytes.
 */
function randomHex(size) {
    // Create a new Uint8Array with the specified size to hold random bytes
    const bytes = new Uint8Array(size);
    // Fill the array with cryptographically secure random values using the Web Crypto API
    const res = getRandomValues(bytes);
    // Convert the random byte array to a hexadecimal string using the toHex function and return it
    return (0, util_js_1.toHex)(res);
}
/**
 * Computes a hash of the given value with optional configurations.
 *
 * @param value - The input data to hash. Can be strings, numbers, booleans, arrays, objects, or other compatible types.
 * @param options - Additional options for hashing.
 *    - algorithm - Hashing algorithm to use. Defaults to "sha-256".
 *    - version - If true, includes the core version string in the hash.
 *    - length - If specified, truncates the resulting hash string to this length.
 *    - salt - Optional salt to prepend to the hashed value.
 *    - readWorkspaceFiles - If true, enables reading file workspace content for hash calculation in special cases where `filename` is specified.
 *    - ...rest - Any remaining properties are included in the hash computation.
 * @returns A promise resolving to the computed hash as a hexadecimal string.
 */
async function hash(value, options) {
    const { algorithm = "sha-256", version, length, salt, readWorkspaceFiles, ...rest } = options || {};
    const SEP = (0, utf8_js_1.utf8Encode)("|");
    const UN = (0, utf8_js_1.utf8Encode)("undefined");
    const NU = (0, utf8_js_1.utf8Encode)("null");
    const h = [];
    const append = async (v) => {
        if (v === null)
            h.push(NU);
        else if (v === undefined)
            h.push(UN);
        else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
            h.push((0, utf8_js_1.utf8Encode)(String(v)));
        else if (Array.isArray(v))
            for (const c of v) {
                h.push(SEP);
                await append(c);
            }
        else if (v instanceof Uint8Array)
            h.push(v);
        else if (v instanceof Buffer)
            h.push(new Uint8Array(v));
        else if (v instanceof ArrayBuffer)
            h.push(new Uint8Array(v));
        else if (v instanceof Blob)
            h.push(new Uint8Array(await v.arrayBuffer()));
        else if (typeof v === "object") {
            for (const c of Object.keys(v).sort()) {
                h.push(SEP);
                h.push((0, utf8_js_1.utf8Encode)(c));
                h.push(SEP);
                await append(v[c]);
            }
            if (readWorkspaceFiles &&
                typeof v.filename === "string" &&
                v.content === undefined &&
                !/^https?:\/\//i.test(v.filename)) {
                try {
                    const h = await hashFile(v.filename);
                    await append(SEP);
                    await append(h);
                }
                catch { }
            }
        }
        else if (typeof v === "function")
            h.push((0, utf8_js_1.utf8Encode)(v.toString()));
        else
            h.push((0, utf8_js_1.utf8Encode)(JSON.stringify(v)));
    };
    if (salt) {
        await append(salt);
        await append(SEP);
    }
    if (version) {
        await append(version_js_1.CORE_VERSION);
        await append(SEP);
    }
    await append(value);
    await append(SEP);
    await append(rest);
    const buf = await digest(algorithm, (0, util_js_1.concatBuffers)(...h));
    let res = (0, util_js_1.toHex)(new Uint8Array(buf));
    if (length)
        res = res.slice(0, length);
    return res;
}
/**
 * Computes the hash of a file using a streaming approach.
 *
 * @param filePath - Path to the file to hash.
 * @param algorithm - Hashing algorithm to use. Defaults to "sha-256".
 * @returns Promise resolving to the file's hash in hexadecimal format.
 */
async function hashFile(filePath, algorithm = "sha-256") {
    return new Promise((resolve, reject) => {
        const hash = (0, node_crypto_1.createHash)(algorithm);
        const stream = (0, node_fs_1.createReadStream)(filePath);
        stream.on("data", (chunk) => {
            hash.update(chunk);
        });
        stream.on("end", () => {
            resolve(hash.digest("hex"));
        });
        stream.on("error", (err) => {
            reject(err);
        });
    });
}
//# sourceMappingURL=crypto.js.map