import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { evaluateFact, evaluateFacts, factualityEvaluator } from "./testevals"

describe("testevals", async () => {
    await test("evaluates a supported fact", async () => {
        const output = "The capital of France is Paris. It is a beautiful city located in the north of France."
        const fact = "Paris is the capital of France"
        
        const result = await evaluateFact(output, fact, { explanations: false })
        
        assert.equal(result.pass, true)
        assert.equal(result.metadata?.label, "supported")
    })

    await test("evaluates a contradicted fact", async () => {
        const output = "The capital of France is Lyon. Paris is just a large city in France."
        const fact = "Paris is the capital of France"
        
        const result = await evaluateFact(output, fact, { explanations: false })
        
        assert.equal(result.pass, false)
        assert.equal(result.metadata?.label, "contradicts")
    })

    await test("evaluates insufficient information", async () => {
        const output = "France is a beautiful country in Europe with rich history and culture."
        const fact = "Paris is the capital of France"
        
        const result = await evaluateFact(output, fact, { explanations: false })
        
        assert.equal(result.pass, false)
        assert.equal(result.metadata?.label, "insufficient")
    })

    await test("evaluates multiple facts", async () => {
        const output = "Paris is the capital of France. London is the capital of England. Both are major European cities."
        const facts = [
            "Paris is the capital of France", 
            "London is the capital of England",
            "Berlin is the capital of Germany"
        ]
        
        const results = await evaluateFacts(output, facts, { explanations: false })
        
        assert.equal(results.length, 3)
        assert.equal(results[0].pass, true) // Paris fact supported
        assert.equal(results[1].pass, true) // London fact supported  
        assert.equal(results[2].pass, false) // Berlin fact not mentioned
    })

    await test("promptfoo-compatible evaluator works", async () => {
        const output = "The capital of France is Paris."
        const fact = "Paris is the capital of France"
        
        const result = await factualityEvaluator(output, fact)
        
        assert.equal(typeof result.pass, "boolean")
        assert.equal(typeof result.score, "number")
        assert.equal(typeof result.reason, "string")
    })

    await test("promptfoo-compatible evaluator handles different output formats", async () => {
        const output = { text: "The capital of France is Paris." }
        const fact = "Paris is the capital of France"
        
        const result = await factualityEvaluator(output, fact)
        
        assert.equal(typeof result.pass, "boolean")
        assert.equal(typeof result.score, "number")
        assert.equal(typeof result.reason, "string")
    })
})