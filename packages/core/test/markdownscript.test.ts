import { describe, test, expect } from "vitest";
import { markdownScriptParse } from "../src/markdownscript.js";

describe("markdownScriptParse", () => {
  test("basic markdown content", async () => {
    const text = `# Hello World

This is a simple markdown document.

- Item 1
- Item 2

\`\`\`javascript
console.log("Hello");
\`\`\`
`;

    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("$`");
    expect(result.jsSource).toContain("# Hello World");
    expect(result.jsSource).toContain("Item 1");
    expect(result.jsSource).toContain("console.log(\"Hello\");");
    expect(result.meta).toEqual({});
  });

  test("markdown with frontmatter", async () => {
    const text = `---
title: "Test Script"
description: "A test script"
---

# Hello World

This is a test.`;

    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("script({");
    expect(result.jsSource).toContain("title: 'Test Script'");
    expect(result.jsSource).toContain("description: 'A test script'");
    expect(result.jsSource).toContain("$`");
    expect(result.jsSource).toContain("# Hello World");
    expect(result.meta).toEqual({
      title: "Test Script",
      description: "A test script"
    });
  });

  test("empty content", async () => {
    const text = "";
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toBe("");
    expect(result.meta).toEqual({});
  });

  test("only frontmatter", async () => {
    const text = `---
title: "Only frontmatter"
---`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("script({");
    expect(result.jsSource).toContain("title: 'Only frontmatter'");
    expect(result.jsSource).not.toContain("$`");
    expect(result.meta).toEqual({
      title: "Only frontmatter"
    });
  });

  test("escapes backticks", async () => {
    const text = "This has `backticks` in it.";
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("\\`backticks\\`");
  });

  test("preserves markdown formatting", async () => {
    const text = `## Section

*Emphasis* and **strong** text.

> Blockquote

[Link](https://example.com)
`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("## Section");
    expect(result.jsSource).toContain("*Emphasis*");
    expect(result.jsSource).toContain("**strong**");
    expect(result.jsSource).toContain("> Blockquote");
    expect(result.jsSource).toContain("[Link](https://example.com)");
  });
});
