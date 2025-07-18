#!/usr/bin/env node

/**
 * Simple test script for the MDX compiler
 */

import { MdxCompiler } from '../dist/index.js';

const testMdxContent = `---
title: "Test Prompt"
model: "gpt-4"
temperature: 0.7
---

# Test MDX Prompt

<System>
You are a helpful AI assistant.
</System>

<User>
Write a hello world function in TypeScript.
</User>

<Def name="example">
This is an example definition.
</Def>

<File name="test.ts" />

This is some regular markdown content that should be preserved.
`;

async function test() {
    console.log('Testing MDX Compiler...');
    
    const compiler = new MdxCompiler();
    
    // Create a mock WorkspaceFile
    const mockFile = {
        filename: 'test.mdx',
        content: testMdxContent,
        type: 'text',
        encoding: 'utf-8',
        size: testMdxContent.length
    };
    
    try {
        const result = await compiler.compileFile(mockFile);
        
        console.log('Compilation Result:');
        console.log('==================');
        console.log(result.content);
        console.log('==================');
        
        if (result.messages.length > 0) {
            console.log('Messages:');
            result.messages.forEach(msg => {
                console.log(`${msg.type.toUpperCase()}: ${msg.message}`);
            });
        }
        
        // Test filename generation
        const outputFilename = compiler.generateOutputFilename('test.mdx');
        console.log(`Output filename: ${outputFilename}`);
        
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
