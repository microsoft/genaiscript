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
        assert.strictEqual(hashedValue, "cf5b68d216bfdd52042ee1cf184e7d6da30db24ddeb50b058a4e2de4eec897d8")
    })

    test("should generate a hash with a specified algorithm", async () => {
        const value = "test"
        const hashedValue = await hash(value, { algorithm: "sha-1" })
        assert.strictEqual(hashedValue, "9ffed885632cdb7cd0035741747950a42dd776ed")
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
        assert.strictEqual(hashedValue, "479be8e5607ab54ac31c9f79820bdb8651df86d11392f2e4245e8b761c49c62a")
    })

    test("should handle objects correctly", async () => {
        const value = { a: 1, b: 2 }
        const hashedValue = await hash(value)
        assert.strictEqual(hashedValue, "84f66fa8d14b5e4690961254ecdeb24cdae959448dde2148410dc49a14472625")
    })

    test("should handle buffers correctly", async () => {
        const value = Buffer.from("test")
        const hashedValue = await hash(value)
        assert.strictEqual(hashedValue, "cf5b68d216bfdd52042ee1cf184e7d6da30db24ddeb50b058a4e2de4eec897d8")
    })

    test("should handle ArrayBuffer correctly", async () => {
        const value = new ArrayBuffer(8)
        const hashedValue = await hash(value)
        assert.strictEqual(hashedValue, "58ae1766c3b851958bb1f1d0a15af1a3e1d3775dcf13b000d3005ddcb3a55c9b")
    })

    test("should handle Blobs correctly", async () => {
        const value = new Blob(["test"])
        const hashedValue = await hash(value)
        assert.strictEqual(hashedValue, "cf5b68d216bfdd52042ee1cf184e7d6da30db24ddeb50b058a4e2de4eec897d8")
    })
})
