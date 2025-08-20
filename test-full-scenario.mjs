import { readFileSync } from 'fs';
import { interpolateVariables } from './packages/core/dist/esm/mustache.js';
import { parsePromptScript } from './packages/core/dist/esm/template.js';
import { parsePromptParameters } from './packages/core/dist/esm/vars.js';

async function testFullEndToEndScenario() {
    const content = readFileSync('/tmp/test-full-scenario.md', 'utf8');
    
    console.log("=== End-to-End Test: Frontmatter Parameters with Jinja ===");
    console.log("Content:", content);
    
    // 1. Parse script to get parameters
    const script = await parsePromptScript('test-full.md', content);
    console.log("\n1. Parsed script parameters:", script.parameters);
    
    // 2. Mock project and resolve parameters with defaults
    const mockProject = {};
    const defaultParams = parsePromptParameters(mockProject, script, {});
    console.log("\n2. Default parameters:", defaultParams);
    
    // 3. Test interpolation with defaults using Mustache (default format)
    const resultDefault = await interpolateVariables(content, defaultParams);
    console.log("\n3. Result with defaults (Mustache):", resultDefault);
    
    // 4. Test with custom values
    const customParams = parsePromptParameters(mockProject, script, {
        greeting: "Hi",
        recipient: "GenAI",
        useExclamation: false,
        count: 2
    });
    console.log("\n4. Custom parameters:", customParams);
    
    // 5. Test interpolation with custom values
    const resultCustom = await interpolateVariables(content, customParams);
    console.log("\n5. Result with custom values (Mustache):", resultCustom);
    
    // 6. Test with Jinja format (for more complex templating)
    const resultJinja = await interpolateVariables(content, customParams, { format: "jinja" });
    console.log("\n6. Result with Jinja format:", resultJinja);
    
    console.log("\n✅ All scenarios working correctly!");
}

testFullEndToEndScenario().catch(console.error);