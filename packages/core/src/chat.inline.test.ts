import { describe, it } from "node:test"
import assert from "node:assert"
import { mergeGenerationOptions } from "./chat.js"

describe("mergeGenerationOptions inline prompt fix", () => {
    it("should ignore script model for inline prompts when no explicit model", () => {
        const options = { 
            model: "small",  // script model
            inner: false,
            trace: {} as any,
            stats: {} as any
        }
        const runOptions = {}  // no explicit model in inline prompt
        
        // Call with inner=true (indicating inline prompt)
        const result = mergeGenerationOptions(options, runOptions, true)
        
        // Should use default large model, not script model
        assert.notStrictEqual(result.model, "small")
        assert.strictEqual(result.model, "large")  // assuming runtimeHost.modelAliases.large.model is "large"
    })
    
    it("should use explicit model for inline prompts", () => {
        const options = { 
            model: "small",  // script model
            inner: false,
            trace: {} as any,
            stats: {} as any
        }
        const runOptions = { model: "explicit-model" }  // explicit model in inline prompt
        
        // Call with inner=true (indicating inline prompt)
        const result = mergeGenerationOptions(options, runOptions, true)
        
        // Should use explicit model
        assert.strictEqual(result.model, "explicit-model")
    })
    
    it("should still use script model for main execution", () => {
        const options = { 
            model: "small",  // script model
            inner: false,
            trace: {} as any,
            stats: {} as any
        }
        const runOptions = {}  // no explicit model
        
        // Call with inner=false or undefined (indicating main script execution)
        const result = mergeGenerationOptions(options, runOptions, false)
        
        // Should use script model
        assert.strictEqual(result.model, "small")
    })
})