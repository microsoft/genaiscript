script({
  title: "LLM-optimized content generator",
  description:
    "Analyze markdown files and generate LLM-optimized content for the 'llmstxt' frontmatter field",
  group: "docs",
  model: "large",
  accept: ".md,.mdx",
});

const OPTIMIZER_VERSION = "0.0.2";

interface LlmsFrontmatter {
  llmstxt?: {
    content: string;
    hash: string;
  };
}

// Process each file individually using runPrompt
for (const file of env.files) {
  console.log(`processing ${file.filename}...`);
  const { llmstxt }: LlmsFrontmatter = MD.frontmatter(file.content) || {};
  const content = MD.content(file.content);
  const contentHash = await parsers.hash({ version: OPTIMIZER_VERSION, content: content.trim() });
  if (contentHash === llmstxt?.hash) {
    continue;
  }

  const { text: optimizedContent, error } = await runPrompt(
    (_) => {
      const fileRef = _.def("CONTENT", content);
      _.$`
You are an expert at optimizing content for Large Language Model (LLM) consumption and understanding.

Analyze the following markdown content in ${fileRef} and generate a concise, LLM-optimized version.

## Requirements:
1. **Extract the core concepts and information** from the original content
2. **Use clear, direct language** that LLMs can easily parse and understand
3. **Maintain technical accuracy** while simplifying complex explanations
4. **Include key code examples or snippets** in a simplified form when relevant
5. **Preserve important terminology and concepts** specific to the domain
6. **Focus on actionable information** and key insights
7. **Use structured format** with clear sections when applicable
8. **Avoid bullet points**, Keep it extremely compact

## Optimization Guidelines:
- Remove redundant explanations and filler words
- Convert verbose descriptions into concise bullet points when appropriate
- Simplify complex sentence structures
- Focus on the "what", "why", and "how" of the content
- Maintain context that would be important for an LLM to understand the topic
- Keep technical accuracy but improve clarity
- Aim for maximum reduction in length while preserving essential information
- Provide simple examples or code snippets where necessary

## Output Format:
Generate ONLY the optimized content text - do not include frontmatter, markdown headers, or any metadata.
The output should be clean, readable text that can be directly inserted into the 'llmstxt' frontmatter field.

Focus on making the content more digestible for LLM processing while retaining all the important information and context.
            `;
    },
    {
      label: file.filename,
      system: ["system"],
      temperature: 0.3,
      model: "large",
      responseType: "text",
    },
  );

  if (error) break;

  // Process the generated content and update the file
  if (optimizedContent?.trim() && optimizedContent.trim().length > 10) {
    const updated = MD.updateFrontmatter(file.content, {
      llmstxt: {
        content: optimizedContent.trim(),
        hash: contentHash,
      },
    } satisfies LlmsFrontmatter);
    // Write the updated content back to the file
    await workspace.writeText(file.filename, updated);
    console.log(`Updated ${file.filename} with optimized content`);
  } else {
    console.log(`Skipped ${file.filename} - no valid optimized content generated`);
  }
}
