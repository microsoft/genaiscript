import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { ollamaParseHostVariable } from "./connection"
import { OLLAMA_API_BASE, OLLAMA_DEFAUT_PORT } from "./constants"

describe("parseHostVariable", () => {
    test("parses OLLAMA_HOST environment variable correctly", () => {
        const env = { OLLAMA_HOST: "http://localhost:3000" }
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, "http://localhost:3000/")
    })

    test("parses OLLAMA_API_BASE environment variable correctly", () => {
        const env = { OLLAMA_API_BASE: "http://api.ollama.com" }
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, "http://api.ollama.com/")
    })

    test("falls back to OLLAMA_API_BASE constant if no environment variable is set", () => {
        const env = {}
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, OLLAMA_API_BASE)
    })

    test("parses IP address with port correctly", () => {
        const env = { OLLAMA_HOST: "192.168.1.1:8080" }
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, "http://192.168.1.1:8080")
    })

    test("parses IP address without port correctly", () => {
        const env = { OLLAMA_HOST: "192.168.1.1" }
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, `http://192.168.1.1:${OLLAMA_DEFAUT_PORT}`)
    })

    test("parses 0.0.0.0 with port correctly", () => {
        const env = { OLLAMA_HOST: "0.0.0.0:4000" }
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, "http://0.0.0.0:4000")
    })

    test("parses localhost with port correctly", () => {
        const env = { OLLAMA_HOST: "localhost:4000" }
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, "http://localhost:4000")
    })

    test("parses 0.0.0.0 without port correctly", () => {
        const env = { OLLAMA_HOST: "0.0.0.0" }
        const result = ollamaParseHostVariable(env)
        assert.strictEqual(result, `http://0.0.0.0:${OLLAMA_DEFAUT_PORT}`)
    })
})
