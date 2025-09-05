import { readFileSync } from 'fs';
import { interpolateVariables } from './packages/core/dist/esm/mustache.js';
import { parsePromptScript } from './packages/core/dist/esm/template.js';
import { parsePromptParameters } from './packages/core/dist/esm/vars.js';

async function testFrontmatterParametersComplete() {
    const content = readFileSync('/tmp/test-frontmatter.md', 'utf8');
    
    console.log("Content:", content);
    console.log("\n=== Testing Complete Flow ===");
    
    // 1. Parse script to get parameters
    const script = await parsePromptScript('test.md', content);
    console.log("Parsed script parameters:", script.parameters);
    
    // 2. Mock a project object (minimal structure needed for parsePromptParameters)
    const mockProject = {
        // Add minimal structure needed for vars.ts
    };
    
    // 3. Parse prompt parameters with defaults (no override vars)
    const parameters = parsePromptParameters(mockProject, script, {});
    console.log("Resolved parameters with defaults:", parameters);
    
    // 4. Test interpolation with default values
    const resultWithDefaults = await interpolateVariables(content, parameters);
    console.log("Interpolated with defaults:", resultWithDefaults);
    
    // 5. Test interpolation with override values
    const overrideVars = { name: "GenAI", count: 5 };
    const parametersWithOverrides = parsePromptParameters(mockProject, script, overrideVars);
    console.log("Resolved parameters with overrides:", parametersWithOverrides);
    
    const resultWithOverrides = await interpolateVariables(content, parametersWithOverrides);
    console.log("Interpolated with overrides:", resultWithOverrides);
}

testFrontmatterParametersComplete().catch(console.error);