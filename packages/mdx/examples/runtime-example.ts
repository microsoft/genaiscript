import { MdxCompiler } from "../src/compiler.js";
import type { WorkspaceFile } from "@genaiscript/core";

/**
 * Example demonstrating MDX runtime execution with custom JSX factory
 */

// Create a sample MDX file
const sampleMdxContent = `---
title: "GenAIScript MDX Example"
model: "gpt-4"
temperature: 0.7
maxTokens: 2000
---

# Code Review Assistant

<System>
You are an expert code reviewer. Analyze the provided code and give constructive feedback.
Focus on:
- Code quality and best practices
- Performance improvements
- Security considerations
- Maintainability
</System>

<Def name="codeFile">
<File name="example.ts" />
</Def>

<User>
Please review this TypeScript file:

{codeFile}

## Questions:
1. Are there any potential bugs?
2. How can the code be improved?
3. Are there any security concerns?

Please provide specific examples and suggestions.
</User>

---

## Additional Context

<Context>
This code is part of a larger web application that handles user authentication.
The team follows strict TypeScript guidelines and uses ESLint with Prettier.
</Context>

<Assistant>
I'll analyze the code systematically:

### Code Quality Analysis
- **Type Safety**: The code properly uses TypeScript types
- **Error Handling**: Check for proper error boundaries
- **Performance**: Look for optimization opportunities

### Security Review
- **Input Validation**: Ensure all inputs are validated
- **Authentication**: Verify proper auth checks
- **Data Sanitization**: Check for XSS prevention

Let me provide detailed feedback...
</Assistant>
`;

// Mock workspace file
const mockFile: WorkspaceFile = {
  filename: "code-review.mdx",
  content: sampleMdxContent,
  type: "text",
  size: sampleMdxContent.length,
};

async function runExample() {
  console.log("🚀 MDX Runtime Execution Example\n");
  
  const compiler = new MdxCompiler();
  
  try {
    // Compile the MDX file
    console.log("📝 Compiling MDX with runtime execution...");
    const result = await compiler.compileFile(mockFile);
    
    console.log("✅ Compilation successful!");
    console.log("\n📋 Messages:", result.messages.length);
    result.messages.forEach(msg => {
      console.log(`  ${msg.type.toUpperCase()}: ${msg.message}`);
    });
    
    console.log("\n🎯 Generated GenAIScript:\n");
    console.log("=" .repeat(80));
    console.log(result.content);
    console.log("=" .repeat(80));
    
    // Create a PromptScript from the result
    const promptScript = compiler.createPromptScript(result, {
      id: "code-review-mdx",
      title: "Code Review Assistant (from MDX)",
      description: "Generated from MDX with runtime execution"
    });
    
    console.log("\n📦 Generated PromptScript metadata:");
    console.log(JSON.stringify({
      id: promptScript.id,
      title: promptScript.title,
      description: promptScript.description,
      model: promptScript.model,
      temperature: promptScript.temperature,
      maxTokens: promptScript.maxTokens,
    }, null, 2));
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the example
runExample().catch(console.error);
