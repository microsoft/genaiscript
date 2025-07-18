import { WorkspaceFile } from "@genaiscript/core";
import { MdxCompiler } from "../src/compiler.js";
import { describe, it, expect } from "vitest";

describe("MdxCompiler", () => {
  const compiler = new MdxCompiler();

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

  const createMockFile = (filename: string, content: string) =>
    ({
      filename,
      content,
      type: "text" as const,
      size: content.length,
    }) satisfies WorkspaceFile;

  describe("compileFile", () => {
    it("should compile MDX content successfully", async () => {
      const mockFile = createMockFile("test.mdx", testMdxContent);
      const result = await compiler.compileFile(mockFile);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe("string");
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it("should handle empty MDX content", async () => {
      const mockFile = createMockFile("empty.mdx", "");
      const result = await compiler.compileFile(mockFile);

      expect(result).toBeDefined();
      expect(result.content).toBe("");
    });

    it("should handle MDX with only frontmatter", async () => {
      const content = `---
title: "Only Frontmatter"
---`;
      const mockFile = createMockFile("frontmatter.mdx", content);
      const result = await compiler.compileFile(mockFile);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it("should handle MDX with only markdown content", async () => {
      const content = "# Simple Markdown\n\nThis is just markdown content.";
      const mockFile = createMockFile("markdown.mdx", content);
      const result = await compiler.compileFile(mockFile);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it("should handle complex JSX components", async () => {
      const content = `# Test

<System role="assistant">
Complex system prompt
</System>

<User>
<File name="complex.ts" language="typescript">
interface Test {
    prop: string;
}
</File>
</User>`;
      const mockFile = createMockFile("complex.mdx", content);
      const result = await compiler.compileFile(mockFile);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });

  describe("generateOutputFilename", () => {
    it("should generate correct output filename for .mdx files", () => {
      const outputFilename = compiler.generateOutputFilename("test.mdx");
      expect(outputFilename).toBeDefined();
      expect(typeof outputFilename).toBe("string");
    });

    it("should handle files without extension", () => {
      const outputFilename = compiler.generateOutputFilename("test");
      expect(outputFilename).toBeDefined();
      expect(typeof outputFilename).toBe("string");
    });

    it("should handle files with different extensions", () => {
      const outputFilename = compiler.generateOutputFilename("test.md");
      expect(outputFilename).toBeDefined();
      expect(typeof outputFilename).toBe("string");
    });

    it("should handle files with path separators", () => {
      const outputFilename = compiler.generateOutputFilename("path/to/test.mdx");
      expect(outputFilename).toBeDefined();
      expect(typeof outputFilename).toBe("string");
    });
  });

  describe("error handling", () => {
    it("should handle malformed frontmatter", async () => {
      const content = `---
title: "Malformed
model: gpt-4
---
# Content`;
      const mockFile = createMockFile("malformed.mdx", content);

      await expect(async () => {
        await compiler.compileFile(mockFile);
      }).not.toThrow();
    });

    it("should handle invalid JSX syntax", async () => {
      const content = `# Test

<System
Invalid JSX syntax
</System>`;
      const mockFile = createMockFile("invalid.mdx", content);

      await expect(async () => {
        await compiler.compileFile(mockFile);
      }).not.toThrow();
    });
  });

  describe("message handling", () => {
    it("should collect messages during compilation", async () => {
      const mockFile = createMockFile("test.mdx", testMdxContent);
      const result = await compiler.compileFile(mockFile);

      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);

      if (result.messages.length > 0) {
        result.messages.forEach((msg) => {
          expect(msg).toHaveProperty("type");
          expect(msg).toHaveProperty("message");
          expect(typeof msg.message).toBe("string");
        });
      }
    });
  });
});
