/**
 * Standalone fact evaluator for use in promptfoo JavaScript assertions
 * This file provides a self-contained fact evaluation function that can be used
 * in promptfoo configurations without requiring external dependencies
 */

// Since this will run in promptfoo context, we need to handle the classify function differently
// For now, create a simplified version that can work as a proof of concept

/**
 * Simple fact evaluator that checks if the output supports the given fact
 * This is a simplified version for integration testing
 * 
 * @param {string} output - The LLM output to evaluate
 * @param {string} fact - The fact to check against the output
 * @returns {Promise<{pass: boolean, score: number, reason: string}>}
 */
async function evaluateFactSimple(output, fact) {
    // Simple keyword-based evaluation for testing
    // In a real implementation, this would call the classify function
    
    const outputLower = output.toLowerCase()
    const factLower = fact.toLowerCase()
    
    // Extract key terms from the fact
    const factWords = factLower.split(/\s+/).filter(word => word.length > 3)
    
    // Check if most key terms from the fact appear in the output
    const matchingWords = factWords.filter(word => outputLower.includes(word))
    const matchRatio = matchingWords.length / factWords.length
    
    const pass = matchRatio >= 0.7 // At least 70% of key terms must match
    const score = matchRatio
    
    return {
        pass,
        score,
        reason: pass 
            ? `Fact supported: ${matchingWords.length}/${factWords.length} key terms found`
            : `Fact not supported: only ${matchingWords.length}/${factWords.length} key terms found`
    }
}

// Export for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { evaluateFactSimple }
}

// Make available globally for browser/promptfoo context
if (typeof globalThis !== 'undefined') {
    globalThis.evaluateFactSimple = evaluateFactSimple
}