import { describe, test, assert, vi, beforeEach, afterEach } from "vitest"
import { parsePromptScript } from "../src/template.js"

describe("template.ts - frontmatter parameters", () => {
    test("should extract parameters from markdown frontmatter", async () => {
        const content = `---
parameters:
  name:
    type: string
    default: "World"
  count:
    type: number
    default: 3
---
Hello {{name}}! This message will repeat {{count}} times.`

        const script = await parsePromptScript("test.md", content)
        
        assert.ok(script.parameters, "parameters should be defined")
        assert.deepEqual(script.parameters.name, {
            type: "string",
            default: "World"
        })
        assert.deepEqual(script.parameters.count, {
            type: "number", 
            default: 3
        })
    })

    test("should handle markdown without frontmatter parameters", async () => {
        const content = `---
title: Simple Test
---
Hello world!`

        const script = await parsePromptScript("test.md", content)
        
        assert.ok(!script.parameters || Object.keys(script.parameters).length === 0)
    })

    test("should handle markdown without frontmatter", async () => {
        const content = `Hello world!`

        const script = await parsePromptScript("test.md", content)
        
        assert.ok(!script.parameters || Object.keys(script.parameters).length === 0)
    })

    test("should merge frontmatter parameters with existing script parameters", async () => {
        // This test simulates a JavaScript file that already has parameters
        // and also has frontmatter parameters (though this is edge case)
        const content = `---
parameters:
  frontmatterParam:
    type: string
    default: "from frontmatter"
---
script({
    parameters: {
        scriptParam: {
            type: "number",
            default: 42
        }
    }
})

Hello world!`

        const script = await parsePromptScript("test.js", content)
        
        assert.ok(script.parameters, "parameters should be defined")
        assert.deepEqual(script.parameters.frontmatterParam, {
            type: "string",
            default: "from frontmatter"
        })
        assert.deepEqual(script.parameters.scriptParam, {
            type: "number",
            default: 42
        })
    })

    test("should handle complex parameter types", async () => {
        const content = `---
parameters:
  items:
    type: array
    default: ["apple", "banana"]
  config:
    type: object
    default:
      enabled: true
      count: 5
  temperature:
    type: number
    default: 0.7
    minimum: 0
    maximum: 1
---
Configuration test with {{items}} and {{config}}.`

        const script = await parsePromptScript("complex.md", content)
        
        assert.ok(script.parameters, "parameters should be defined")
        assert.deepEqual(script.parameters.items, {
            type: "array",
            default: ["apple", "banana"]
        })
        assert.deepEqual(script.parameters.config, {
            type: "object",
            default: {
                enabled: true,
                count: 5
            }
        })
        assert.deepEqual(script.parameters.temperature, {
            type: "number",
            default: 0.7,
            minimum: 0,
            maximum: 1
        })
    })
})

describe("template.ts - environment variable default metadata", () => {
    let originalEnv: any

    beforeEach(() => {
        originalEnv = { ...process.env }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    test("should merge environment default metadata into script metadata field", async () => {
        process.env.GENAISCRIPT_DEFAULT_SCRIPT_META = '{"metadata": {"env_key": "env_value", "shared_key": "env_shared"}}'

        const content = `script({
            title: "Test Script",
            description: "A test script",
            metadata: {
                script_key: "script_value",
                shared_key: "script_shared"
            }
        })

        Hello world!`

        const script = await parsePromptScript("test.genai.mts", content)
        
        assert.strictEqual(script.title, "Test Script")
        assert.strictEqual(script.description, "A test script")
        assert.ok(script.metadata)
        assert.strictEqual(script.metadata.env_key, "env_value")
        assert.strictEqual(script.metadata.script_key, "script_value")
        // Environment metadata should take precedence for shared keys
        assert.strictEqual(script.metadata.shared_key, "env_shared")
    })

    test("should handle environment metadata without existing script metadata", async () => {
        process.env.GENAISCRIPT_DEFAULT_SCRIPT_META = '{"metadata": {"env_key": "env_value"}}'

        const content = `script({
            title: "Test Script"
        })

        Hello world!`

        const script = await parsePromptScript("test.genai.mts", content)
        
        assert.strictEqual(script.title, "Test Script")
        assert.ok(script.metadata)
        assert.strictEqual(script.metadata.env_key, "env_value")
    })


    test("should work without environment variable set", async () => {
        delete process.env.GENAISCRIPT_DEFAULT_SCRIPT_META

        const content = `script({
            title: "Test Script",
            metadata: {
                original: "value"
            }
        })

        Hello world!`

        const script = await parsePromptScript("test.genai.mts", content)
        
        assert.strictEqual(script.title, "Test Script")
        assert.ok(script.metadata)
        assert.strictEqual(script.metadata.original, "value")
    })

    test("should handle invalid JSON in environment variable gracefully", async () => {
        process.env.GENAISCRIPT_DEFAULT_SCRIPT_META = 'invalid json {'

        const content = `script({
            title: "Test Script"
        })

        Hello world!`

        const script = await parsePromptScript("test.genai.mts", content)
        
        assert.strictEqual(script.title, "Test Script")
        // Should not throw an error, just ignore the invalid env var
    })

    test("should handle environment metadata with nested objects", async () => {
        process.env.GENAISCRIPT_DEFAULT_SCRIPT_META = '{"metadata": {"nested": {"key": "value"}, "simple": "data"}}'

        const content = `script({
            title: "Test Script"
        })

        Hello world!`

        const script = await parsePromptScript("test.genai.mts", content)
        
        assert.strictEqual(script.title, "Test Script")
        assert.ok(script.metadata)
        assert.deepEqual(script.metadata.nested, { key: "value" })
        assert.strictEqual(script.metadata.simple, "data")
    })
})