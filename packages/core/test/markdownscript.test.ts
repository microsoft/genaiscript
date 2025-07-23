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

  test("handles HTML audio tags", async () => {
    const text = `# Test

<audio src="./test.mp3" />

Some text after audio.`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("defAudio");
    expect(result.jsSource).toContain('"./test.mp3"');
    expect(result.jsSource).toContain("// audio ./test.mp3");
    expect(result.jsSource).toContain("Some text after audio.");
  });

  test("handles mixed image and audio content", async () => {
    const text = `# Test

![image](./test.jpg)

<audio src="./test.mp3" />

Some text.`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("defImages");
    expect(result.jsSource).toContain('"./test.jpg"');
    expect(result.jsSource).toContain("defAudio");
    expect(result.jsSource).toContain('"./test.mp3"');
    expect(result.jsSource).toContain("Some text.");
  });

  test("handles multiple audio files", async () => {
    const text = `# Test

<audio src="./test1.mp3" />

Some text.

<audio src="./test2.wav" />

More text.`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain("defAudio");
    expect(result.jsSource).toContain('"./test1.mp3"');
    expect(result.jsSource).toContain('"./test2.wav"');
    expect(result.jsSource).toContain("// audio ./test1.mp3");
    expect(result.jsSource).toContain("// audio ./test2.wav");
  });

  test("ignores non-audio HTML tags", async () => {
    const text = `# Test

<video src="./test.mp4" />

<div>Some content</div>

Some text.`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).not.toContain("defAudio");
    expect(result.jsSource).toContain("<video src=");
    expect(result.jsSource).toContain("<div>Some content</div>");
  });

  test("handles audio tags with various quote styles", async () => {
    const text = `# Test

<audio src='./test1.mp3' />

<audio src="./test2.mp3" />

<audio src = "./test3.mp3" />`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain('defAudio("./test1.mp3")');
    expect(result.jsSource).toContain('defAudio("./test2.mp3")');
    expect(result.jsSource).toContain('defAudio("./test3.mp3")');
  });

  test("handles audio tags with additional attributes", async () => {
    const text = `<audio src="./test.mp3" controls autoplay />`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain('defAudio("./test.mp3")');
    expect(result.jsSource).toContain("// audio ./test.mp3");
  });

  test("handles case-insensitive audio tags", async () => {
    const text = `# Test

<Audio src="./test1.mp3" />

<AUDIO SRC="./test2.mp3" />`;
    
    const result = await markdownScriptParse(text);
    
    expect(result.jsSource).toContain('defAudio("./test1.mp3")');
    expect(result.jsSource).toContain('defAudio("./test2.mp3")');
  });
});
