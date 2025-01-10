import assert from "node:assert/strict"
import test, { beforeEach, describe } from "node:test"
import { hash, randomHex } from "./crypto"
import { TestHost } from "./testhost"

describe("randomHex function", () => {
    test("should generate a hex string of the correct length", () => {
        const size = 16
        const hexString = randomHex(size)
        assert.strictEqual(hexString.length, size * 2)
    })

    test("should ensure randomness in generated hex strings", () => {
        const size = 16
        const hexString1 = randomHex(size)
        const hexString2 = randomHex(size)
        assert.notStrictEqual(hexString1, hexString2)
    })

    test("should handle the smallest valid size correctly", () => {
        const size = 1
        const hexString = randomHex(size)
        assert.strictEqual(hexString.length, 2)
    })

    test("should handle a large size correctly", () => {
        const size = 1024
        const hexString = randomHex(size)
        assert.strictEqual(hexString.length, size * 2)
    })

    test("should return an empty string for size 0", () => {
        const size = 0
        const hexString = randomHex(size)
        assert.strictEqual(hexString, "")
    })
})
describe("hash function", () => {
    beforeEach(async () => {
        TestHost.install()
    })

    test("should generate a SHA-256 hash by default", async () => {
        const value = "test"
        const hashedValue = await hash(value)
    })

    test("should generate a hash with a specified algorithm", async () => {
        const value = "test"
        const hashedValue = await hash(value, { algorithm: "sha-256" })
    })

    test("should generate a hash with a specified length", async () => {
        const value = "test"
        const options = { length: 32 }
        const hashedValue = await hash(value, options)
        assert.strictEqual(hashedValue.length, 32)
    })

    test("should include version in the hash when specified", async () => {
        const value = "test"
        const options = { version: true }
        const hashedValue = await hash(value, options)
        assert.strictEqual(hashedValue.length, 64)
    })

    test("should handle null and undefined values correctly", async () => {
        const value: any = null
        const hashedValueNull = await hash(value)
        const hashedValueUndefined = await hash(undefined)
        assert.notStrictEqual(hashedValueNull, hashedValueUndefined)
    })

    test("should handle arrays correctly", async () => {
        const value = [1, 2, 3]
        const hashedValue = await hash(value)
    })

    test("should handle objects correctly", async () => {
        const value = { a: 1, b: 2 }
        const hashedValue = await hash(value)
    })

    test("should handle buffers correctly", async () => {
        const value = Buffer.from("test")
        const hashedValue = await hash(value)
    })

    test("should handle ArrayBuffer correctly", async () => {
        const value = new ArrayBuffer(8)
        const hashedValue = await hash(value)
    })

    test("should handle Blobs correctly", async () => {
        const value = new Blob(["test"])
        const hashedValue = await hash(value)
    })
})
