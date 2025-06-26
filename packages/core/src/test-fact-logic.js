/**
 * Simple test to validate the fact evaluation logic implementation
 */

// Simple classification logic extracted from the promptfoo JavaScript assertion
function evaluateFactSimpleSync(output, fact) {
    const outputText = typeof output === 'string' ? output : 
                      output?.text || 
                      output?.content ||
                      JSON.stringify(output);
    
    const factLower = fact.toLowerCase();
    const outputLower = outputText.toLowerCase();
    
    // Extract key concepts from the fact
    const factWords = factLower
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'has', 'have', 'had'].includes(word));
    
    // Check for explicit contradictions
    const contradictionPhrases = ['not', 'never', 'cannot', 'does not', 'is not', 'are not'];
    const hasContradiction = contradictionPhrases.some(phrase => 
        outputLower.includes(phrase) && factWords.some(word => 
            outputLower.includes(phrase + ' ' + word) || 
            outputLower.includes(word + ' ' + phrase)
        )
    );
    
    if (hasContradiction) {
        return {
            pass: false,
            score: 0,
            reason: "Output contradicts the fact"
        };
    }
    
    // Check for supporting evidence
    const supportingWords = factWords.filter(word => outputLower.includes(word));
    const supportRatio = supportingWords.length / factWords.length;
    
    // Require at least 70% of key terms to be present for support
    const threshold = 0.7;
    const pass = supportRatio >= threshold;
    
    return {
        pass,
        score: supportRatio,
        reason: pass 
            ? `Fact supported: ${supportingWords.length}/${factWords.length} key terms found`
            : `Insufficient evidence: only ${supportingWords.length}/${factWords.length} key terms found`
    };
}

// Test cases
console.log("Testing fact evaluation logic...\n");

// Test 1: Supported fact
const test1 = evaluateFactSimpleSync(
    "The capital of France is Paris. It is a beautiful city.",
    "Paris is the capital of France"
);
console.log("Test 1 (Supported):", test1);

// Test 2: Contradicted fact
const test2 = evaluateFactSimpleSync(
    "The capital of France is not Paris. It is actually Lyon.",
    "Paris is the capital of France"
);
console.log("Test 2 (Contradicted):", test2);

// Test 3: Insufficient information
const test3 = evaluateFactSimpleSync(
    "France is a beautiful country in Europe.",
    "Paris is the capital of France"
);
console.log("Test 3 (Insufficient):", test3);

// Test 4: Different output format
const test4 = evaluateFactSimpleSync(
    { text: "Paris is indeed the capital city of France." },
    "Paris is the capital of France"
);
console.log("Test 4 (Object format):", test4);

console.log("\nFact evaluation logic test completed.");