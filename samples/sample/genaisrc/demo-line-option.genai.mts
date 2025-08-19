// This is a sample GenAI script demonstrating the new 'line' option in def()

script({
    title: "Demo of line option in def",
    description: "Shows how to use the new line option to focus on content around a specific line",
})

// Create a sample file with content
const sampleCode = `function calculateSum(a, b) {
    // Validate inputs
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Both arguments must be numbers');
    }
    
    // Calculate the sum
    const result = a + b;
    
    // Log the operation for debugging
    console.log(\`Adding \${a} + \${b} = \${result}\`);
    
    // Return the result
    return result;
}

function calculateProduct(a, b) {
    // Validate inputs
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Both arguments must be numbers');
    }
    
    // Calculate the product
    const result = a * b;
    
    // Log the operation for debugging
    console.log(\`Multiplying \${a} * \${b} = \${result}\`);
    
    // Return the result
    return result;
}

function main() {
    const x = 5;
    const y = 3;
    
    const sum = calculateSum(x, y);
    const product = calculateProduct(x, y);
    
    console.log(\`Sum: \${sum}, Product: \${product}\`);
}

main();`

// Example 1: Focus on the calculateSum function around line 7 (the main logic)
def("CALCULATE_SUM_FUNCTION", { filename: "math.js", content: sampleCode }, { line: 7 })

// Example 2: Focus on the calculateProduct function around line 20 (the main logic)  
def("CALCULATE_PRODUCT_FUNCTION", { filename: "math.js", content: sampleCode }, { line: 20 })

// Example 3: Traditional range extraction for comparison
def("FULL_FILE", { filename: "math.js", content: sampleCode })

$`
Analyze the code focusing on:

1. The CALCULATE_SUM_FUNCTION (extracted around line 7)
2. The CALCULATE_PRODUCT_FUNCTION (extracted around line 20)

Compare these focused extractions with the FULL_FILE to see how the 'line' option 
helps focus on specific areas of interest.

What patterns do you notice in the code structure?
`