import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { parsePromptScript } from "./template"

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
})