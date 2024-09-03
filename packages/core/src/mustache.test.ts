import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { interpolateVariables } from "./mustache"

describe("interpolateVariables", () => {

    test("should interpolate variables correctly in markdown", async () => {
      const md = `---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
model:
    api: chat
    configuration:
        type: azure_openai
        azure_deployment: gpt-4o
    parameters:
        max_tokens: 128
        temperature: 0.2
inputs:
  question:
    type: string
sample:
  "question": "Who is the most famous person in the world?"
---
system:
You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly. 

user:
{{question}}`
        const expectedOutput = `Hello, John Doe. You are 30 years old.` // Assume this is the correct interpolation
        const output = await interpolateVariables(md, { question: "THE QUESTION"})
        assert.strictEqual(output, `

You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly. 


THE QUESTION`)
    })
})
