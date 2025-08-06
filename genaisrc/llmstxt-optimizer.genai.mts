script({
  title: "LLM-optimized content generator",
  description:
    "Analyze markdown files and generate LLM-optimized content for the 'llmstxt' frontmatter field",
  group: "docs",
  model: "large",
  accept: ".md,.mdx",
});

const OPTIMIZER_VERSION = "0.0.3";

interface LlmsFrontmatter {
  llmstxt?: {
    content: string;
    hash: string;
  };
}

// Collect all processed content for llms.txt generation
const processedPages: Array<{
  filename: string;
  title: string;
  description: string;
  optimizedContent: string;
}> = [];

// Process each file individually using runPrompt
for (const file of env.files) {
  console.log(`processing ${file.filename}...`);
  const { llmstxt }: LlmsFrontmatter = MD.frontmatter(file.content) || {};
  const content = MD.content(file.content);
  const contentHash = await parsers.hash({ version: OPTIMIZER_VERSION, content: content.trim() });
  if (contentHash === llmstxt?.hash) {
    // Extract title from frontmatter or filename
    const frontmatter = MD.frontmatter(file.content);
    const title =
      frontmatter?.title || file.filename.replace(/\.(md|mdx)$/, "").replace(/.*\//, "");

    // Add existing optimized content to processedPages
    processedPages.push({
      filename: file.filename,
      title,
      description: frontmatter?.description || "",
      optimizedContent: llmstxt.content,
    });
    console.log(`Skipped ${file.filename} - content unchanged, added to processed pages`);
    continue;
  }

  const { text: optimizedContent, error } = await runPrompt(
    (_) => {
      const fileRef = _.def("CONTENT", content);
      _.$`
You are an expert at optimizing content for Large Language Model (LLM) consumption and understanding.

Analyze the following markdown or MDX content in ${fileRef} and generate a concise, LLM-optimized version.

## Requirements:
1. **Extract the core concepts and information** from the original content
2. **Use clear, direct language** that LLMs can easily parse and understand
3. **Maintain technical accuracy** while simplifying complex explanations
4. **Include key code examples or snippets** in a simplified form when relevant
5. **Preserve important terminology and concepts** specific to the domain
6. **Focus on actionable information** and key insights
7. **Use structured format** with clear sections when applicable
8. **Avoid bullet points**, Keep it extremely compact
9. Ignore imports from MDX, those are just for rendering purposes and not interesting for the final summary.

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

    // Extract title from frontmatter or filename
    const frontmatter = MD.frontmatter(file.content);
    const title =
      frontmatter?.title || file.filename.replace(/\.(md|mdx)$/, "").replace(/.*\//, "");

    // Store processed page data
    processedPages.push({
      filename: file.filename,
      title,
      description: frontmatter?.description || "",
      optimizedContent: optimizedContent.trim(),
    });
  } else {
    console.log(`Skipped ${file.filename} - no valid optimized content generated`);
  }
}

// Generate llms.txt and llms-full.txt files after processing all pages
if (processedPages.length > 0) {
  // Generate llms-full.txt with full original content
  const llmsFullTxtContent = processedPages
    .map((page) => {
      const relativeFilename = page.filename.replace(/^.*\/docs\//, "").replace(/\.mdx?$/, "");
      return `## [${page.title}](${relativeFilename})\n\n${page.optimizedContent}`;
    })
    .join("\n\n");

  const fn = "docs/public/genaiscript-docs.instructions.md";
  await workspace.writeText(fn, llmsFullTxtContent);
  console.log(`Generated ${fn} - ${await tokenizers.count(llmsFullTxtContent)}t`);

  const compressed = await runPrompt(
    (ctx) => {
      const fileRef = ctx.def("CONTENT", llmsFullTxtContent);
      ctx.$`
You are an expert at compressing content for Large Language Model (LLM) consumption.
Summarize the content in ${fileRef} to reduce its size while preserving enough information to properly and correctly generate GenAIScript scripts.
THIS IS SO IMPORTANT, SPEND AS MUCH TOKENS AS NEEDED ON CODE SNIPPETS. Generate at least 16000 tokens.
The output will be used by a LLM.
`.role("system");
    },
    {
      system: [],
      systemSafety: false,
      temperature: 0.1,
      responseType: "text",
      model: "large",
      throwOnError: true,
    },
  );

  const dfn = "docs/public/genaiscript-docs.instructions.md";
  await workspace.writeText(dfn, compressed.text);
  console.log(`Generated ${fn} - ${await tokenizers.count(llmsFullTxtContent)}t`);
} else {
  console.log("No pages were processed - skipping llms.txt generation");
}
