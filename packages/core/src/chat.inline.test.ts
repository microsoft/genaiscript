import { describe, it } from "node:test"
import assert from "node:assert"
import { mergeGenerationOptions } from "./chat.js"
import { runtimeHost } from "./host.js"

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
        assert.strictEqual(result.model, runtimeHost.modelAliases.large.model)
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
    
    it("should work with undefined inner parameter (legacy compatibility)", () => {
        const options = { 
            model: "small",  // script model
            inner: false,
            trace: {} as any,
            stats: {} as any
        }
        const runOptions = {}  // no explicit model
        
        // Call with undefined inner (should behave like main script execution)
        const result = mergeGenerationOptions(options, runOptions)
        
        // Should use script model (legacy behavior)
        assert.strictEqual(result.model, "small")
    })
    
    it("should handle null/undefined options gracefully", () => {
        const options = { 
            model: "small",
            inner: false,
            trace: {} as any,
            stats: {} as any
        }
        const runOptions = null
        
        // Should not throw and should use fallback behavior
        const result = mergeGenerationOptions(options, runOptions, true)
        assert.strictEqual(result.model, runtimeHost.modelAliases.large.model)
    })
})