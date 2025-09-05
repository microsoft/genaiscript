import { readFileSync } from 'fs';
import { interpolateVariables } from './packages/core/dist/esm/mustache.js';
import { parsePromptScript } from './packages/core/dist/esm/template.js';
import { parsePromptParameters } from './packages/core/dist/esm/vars.js';

async function testManualInterpolation() {
    const content = readFileSync('genaisrc/test-frontmatter-cli.genai.md', 'utf8');
    
    console.log("Original content:", content);
    
    // 1. Parse script to get parameters
    const script = await parsePromptScript('test-frontmatter-cli.genai.md', content);
    console.log("\n1. Script parameters:", script.parameters);
    
    // 2. Parse prompt parameters with defaults
    const mockProject = {};
    const parameters = parsePromptParameters(mockProject, script, {});
    console.log("\n2. Resolved parameters:", parameters);
    
    // 3. Manually interpolate the markdown content
    const interpolatedContent = await interpolateVariables(content, parameters);
    console.log("\n3. Interpolated content:", interpolatedContent);
}

testManualInterpolation().catch(console.error);