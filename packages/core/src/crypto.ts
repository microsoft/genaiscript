import { getRandomValues as cryptoGetRandomValues } from "crypto"
// crypto.ts - Provides cryptographic functions for secure operations

// Importing the toHex function from the util module to convert byte arrays to hexadecimal strings
import { concatBuffers, toHex, utf8Encode } from "./util"
import { createReadStream } from "fs"
import { createHash } from "crypto"
import { CORE_VERSION } from "./version"

function getRandomValues(bytes: Uint8Array) {
    if (typeof self !== "undefined" && self.crypto) {
        return self.crypto.getRandomValues(bytes)
    } else {
        return cryptoGetRandomValues(bytes)
    }
}

async function digest(algorithm: string, data: Uint8Array) {
    algorithm = algorithm.toUpperCase()
    if (typeof self !== "undefined" && self.crypto) {
        return self.crypto.subtle.digest(algorithm, data)
    } else {
        const { subtle } = await import("crypto")
        return subtle.digest(algorithm, data)
    }
}

/**
 * Generates a random hexadecimal string of the specified size.
 *
 * @param size - The number of random bytes to generate, which will be converted to a hexadecimal string.
 * @returns A hexadecimal string representation of the generated random bytes.
 */
export function randomHex(size: number) {
    // Create a new Uint8Array with the specified size to hold random bytes
    const bytes = new Uint8Array(size)

    // Fill the array with cryptographically secure random values using the Web Crypto API
    const res = getRandomValues(bytes)

    // Convert the random byte array to a hexadecimal string using the toHex function and return it
    return toHex(res)
}

export async function hash(value: any, options?: HashOptions) {
    const {
        algorithm = "sha-256",
        version,
        length,
        salt,
        readWorkspaceFiles,
        ...rest
    } = options || {}

    const sep = utf8Encode("|")
    const un = utf8Encode("undefined")
    const nu = utf8Encode("null")

    const h: Uint8Array[] = []
    const append = async (v: any) => {
        if (v === null) h.push(nu)
        else if (v === undefined) h.push(un)
        else if (
            typeof v == "string" ||
            typeof v === "number" ||
            typeof v === "boolean"
        )
            h.push(utf8Encode(String(v)))
        else if (Array.isArray(v))
            for (const c of v) {
                h.push(sep)
                await append(c)
            }
        else if (v instanceof Uint8Array) h.push(v)
        else if (v instanceof Buffer) h.push(new Uint8Array(v))
        else if (v instanceof ArrayBuffer) h.push(new Uint8Array(v))
        else if (v instanceof Blob)
            h.push(new Uint8Array(await v.arrayBuffer()))
        else if (typeof v === "object") {
            for (const c of Object.keys(v).sort()) {
                h.push(sep)
                h.push(utf8Encode(c))
                h.push(sep)
                await append(v[c])
            }
            if (
                readWorkspaceFiles &&
                typeof v.filename === "string" &&
                v.content === undefined &&
                !/^https?:\/\//i.test(v.filename)
            ) {
                try {
                    const h = await hashFile(v.filename)
                    await append(sep)
                    await append(h)
                } catch {}
            }
        } else if (typeof v === "function") h.push(utf8Encode(v.toString()))
        else h.push(utf8Encode(JSON.stringify(v)))
    }

    if (salt) {
        await append(salt)
        await append(sep)
    }

    if (version) {
        await append(CORE_VERSION)
        await append(sep)
    }
    await append(value)
    await append(sep)
    await append(rest)

    const buf = await digest(algorithm, concatBuffers(...h))
    let res = toHex(new Uint8Array(buf))
    if (length) res = res.slice(0, length)
    return res
}

/**
 * Computes the hash of a file using a streaming approach.
 *
 * @param filePath - Path to the file for which the hash is calculated.
 * @param algorithm - Hashing algorithm to use, defaults to "sha-256".
 * @returns A promise resolving to the file's hash in hexadecimal format.
 */
export async function hashFile(
    filePath: string,
    algorithm: string = "sha-256"
): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash(algorithm)
        const stream = createReadStream(filePath)

        stream.on("data", (chunk) => {
            hash.update(chunk)
        })

        stream.on("end", () => {
            resolve(hash.digest("hex"))
        })

        stream.on("error", (err) => {
            reject(err)
        })
    })
}
