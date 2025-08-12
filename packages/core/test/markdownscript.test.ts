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

  test("processes @include directive", async () => {
    const text = `# Main Content

This is the main content.

@include "test-file.txt"

More content after include.`;
    
    // Mock workspace.readText for the test
    const mockReadText = async (filepath: string) => {
      if (filepath.endsWith("test-file.txt")) {
        return "This is the included content.";
      }
      throw new Error(`File not found: ${filepath}`);
    };

    const result = await markdownScriptParse(text, { 
      readText: mockReadText, 
      baseDir: "/test" 
    });
    
    expect(result.jsSource).toContain("# Main Content");
    expect(result.jsSource).toContain("This is the included content.");
    expect(result.jsSource).toContain("More content after include.");
    expect(result.jsSource).not.toContain("@include");
  });

  test("handles missing include files gracefully", async () => {
    const text = `# Main Content

@include "missing-file.txt"

More content.`;
    
    const mockReadText = async (filepath: string) => {
      throw new Error(`File not found: ${filepath}`);
    };

    const result = await markdownScriptParse(text, { 
      readText: mockReadText, 
      baseDir: "/test" 
    });
    
    // Should include a comment about the missing file
    expect(result.jsSource).toContain("# Main Content");
    expect(result.jsSource).toContain("More content.");
    expect(result.jsSource).toContain("Error including missing-file.txt:");
  });

  test("processes multiple @include directives", async () => {
    const text = `# Main Content

@include "file1.txt"

Middle content.

@include "file2.txt"

End content.`;
    
    const mockReadText = async (filepath: string) => {
      if (filepath.endsWith("file1.txt")) {
        return "Content from file 1";
      }
      if (filepath.endsWith("file2.txt")) {
        return "Content from file 2";
      }
      throw new Error(`File not found: ${filepath}`);
    };

    const result = await markdownScriptParse(text, { 
      readText: mockReadText, 
      baseDir: "/test" 
    });
    
    expect(result.jsSource).toContain("Content from file 1");
    expect(result.jsSource).toContain("Content from file 2");
    expect(result.jsSource).toContain("Middle content.");
    expect(result.jsSource).toContain("End content.");
    expect(result.jsSource).not.toContain("@include");
  });

  test("works without readText option", async () => {
    const text = `# Main Content

@include "some-file.txt"

More content.`;
    
    const result = await markdownScriptParse(text);
    
    // Should leave @include directive unchanged when no readText is provided
    expect(result.jsSource).toContain("@include \"some-file.txt\"");
    expect(result.jsSource).toContain("# Main Content");
    expect(result.jsSource).toContain("More content.");
  });
});
