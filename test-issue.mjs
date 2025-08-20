import { readFileSync } from 'fs';
import { interpolateVariables } from './packages/core/dist/esm/mustache.js';
import { parsePromptScript } from './packages/core/dist/esm/template.js';

async function testFrontmatterParameters() {
    const content = readFileSync('/tmp/test-frontmatter.md', 'utf8');
    
    console.log("Content:", content);
    console.log("\n=== Testing Current Behavior ===");
    
    // Test current mustache interpolation
    const result = await interpolateVariables(content, { name: "GenAI", count: 5 });
    console.log("Interpolated result:", result);
    
    // Test script parsing
    const script = await parsePromptScript('test.md', content);
    console.log("Parsed script parameters:", script.parameters);
}

testFrontmatterParameters().catch(console.error);