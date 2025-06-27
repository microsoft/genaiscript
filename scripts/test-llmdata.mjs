#!/usr/bin/env node

/**
 * Simple test to validate the generated llmdata.js file
 */

import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

async function testLLMData() {
    try {
        console.log('Testing generated llmdata.js...')
        
        // Check if the file exists
        const llmdataPath = join(rootDir, 'packages/core/src/llmdata.js')
        const content = await readFile(llmdataPath, 'utf8')
        
        // Basic validation
        if (!content.includes('LLMDATA')) {
            throw new Error('Generated file does not contain LLMDATA export')
        }
        
        if (!content.includes('export default LLMDATA')) {
            throw new Error('Generated file does not have default export')
        }
        
        if (!content.includes('export const { providers, models, aliases, pricings }')) {
            throw new Error('Generated file does not have named exports')
        }
        
        // Import the module to validate it can be loaded
        const llmdataModule = await import(`file://${llmdataPath}`)
        const data = llmdataModule.default
        
        // Validate structure
        const requiredFields = ['$schema', 'version', 'generated', 'source', 'providers', 'models', 'aliases', 'pricings']
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`)
            }
        }
        
        // Validate types
        if (!Array.isArray(data.providers)) {
            throw new Error('providers should be an array')
        }
        
        if (!Array.isArray(data.models)) {
            throw new Error('models should be an array')
        }
        
        if (typeof data.aliases !== 'object') {
            throw new Error('aliases should be an object')
        }
        
        if (typeof data.pricings !== 'object') {
            throw new Error('pricings should be an object')
        }
        
        console.log('✓ llmdata.js structure validation passed')
        
        // Check TypeScript definitions
        const typeDefsPath = join(rootDir, 'packages/core/src/llmdata.d.ts')
        const typeDefsContent = await readFile(typeDefsPath, 'utf8')
        
        if (!typeDefsContent.includes('export interface LLMData')) {
            throw new Error('TypeScript definitions missing LLMData interface')
        }
        
        if (!typeDefsContent.includes('declare const LLMDATA: LLMData')) {
            throw new Error('TypeScript definitions missing LLMDATA declaration')
        }
        
        console.log('✓ llmdata.d.ts structure validation passed')
        
        // Summary
        console.log('\nValidation Summary:')
        console.log(`- Schema: ${data.$schema}`)
        console.log(`- Version: ${data.version}`)
        console.log(`- Source: ${data.source}`)
        console.log(`- Generated: ${data.generated}`)
        console.log(`- Providers: ${data.providers.length}`)
        console.log(`- Models: ${data.models.length}`)
        console.log(`- Aliases: ${Object.keys(data.aliases).length}`)
        console.log(`- Pricing entries: ${Object.keys(data.pricings).length}`)
        
        console.log('\n✓ All tests passed!')
        
    } catch (error) {
        console.error('Test failed:', error.message)
        process.exit(1)
    }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testLLMData()
}

export { testLLMData }