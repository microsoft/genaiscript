import { describe, it, expect } from "vitest";
import { MdxRuntime } from "../src/runtime.js";
import { MdxTransformer } from "../src/transformer.js";

describe("MdxRuntime", () => {
  const runtime = new MdxRuntime();
  const transformer = new MdxTransformer();

  describe("runtime execution", () => {
    it("should execute simple MDX with System component", async () => {
      const mdxContent = `
# Test Prompt

<System>
You are a helpful AI assistant.
</System>

<User>
Hello, world!
</User>
`;

      const result = await transformer.transform(mdxContent);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("system");
      expect(result.content).toContain("user");
    });

    it("should handle MDX with Def components", async () => {
      const mdxContent = `
<Def name="greeting">
Hello from MDX!
</Def>

<User>
{greeting}
</User>
`;

      const result = await transformer.transform(mdxContent);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("def");
    });

    it("should handle MDX with File components", async () => {
      const mdxContent = `
<File name="test.ts" />

<User>
Review the above file.
</User>
`;

      const result = await transformer.transform(mdxContent);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("file");
    });

    it("should handle MDX with standard HTML elements", async () => {
      const mdxContent = `
<User>
<h1>Title</h1>
<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
</User>
`;

      const result = await transformer.transform(mdxContent);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("user");
    });

    it("should handle MDX with fragments", async () => {
      const mdxContent = `
<User>
  <>
    <p>Fragment content 1</p>
    <p>Fragment content 2</p>
  </>
</User>
`;

      const result = await transformer.transform(mdxContent);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("user");
    });

    it("should fallback to simple conversion on runtime errors", async () => {
      const mdxContent = `
<System>
This should work with fallback.
</System>
`;

      const result = await transformer.transform(mdxContent);
      expect(result.content).toBeDefined();
      // Should not contain error messages since fallback should work
      expect(result.messages.filter(m => m.type === "error")).toHaveLength(0);
    });
  });

  describe("direct runtime execution", () => {
    it("should execute compiled MDX directly", async () => {
      // Simple mock compiled MDX that returns a JSX element
      const compiledMdx = `
        function MDXContent() {
          return jsx('div', { children: ['Hello from MDX!'] });
        }
        return MDXContent;
      `;

      const result = await runtime.execute(compiledMdx);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should handle custom components", async () => {
      const compiledMdx = `
        function MDXContent() {
          return jsx('CustomComponent', { message: 'Hello!' });
        }
        return MDXContent;
      `;

      const customComponents = {
        CustomComponent: ({ message }: { message: string }) => `Custom: ${message}`
      };

      const result = await runtime.executeWithComponents(compiledMdx, customComponents);
      expect(result).toBeDefined();
    });
  });
});
