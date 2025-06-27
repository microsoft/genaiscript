import { describe, expect, test } from "vitest";
import { mdastParse, mdastStringify, unifiedVisit } from "../src/unified.js";
import type { Root, Heading, Text } from "mdast";

describe("unified", () => {
  test("mdastParse with string content", async () => {
    const content = "# Hello World\n\nThis is a test.";
    const result = await mdastParse(content);
    
    expect(result).toBeDefined();
    expect(result.type).toBe("root");
    expect(result.children).toHaveLength(2);
  });

  test("mdastParse with WorkspaceFile", async () => {
    const file = {
      filename: "test.md",
      content: "## Test Header\n\n- Item 1\n- Item 2"
    };
    const result = await mdastParse(file);
    
    expect(result).toBeDefined();
    expect(result.type).toBe("root");
    expect(result.children.length).toBeGreaterThan(0);
  });

  test("mdastParse with empty content", async () => {
    const result = await mdastParse("");
    
    expect(result).toBeDefined();
    expect(result.type).toBe("root");
    expect(result.children).toHaveLength(0);
  });

  test("mdastStringify with valid root", async () => {
    const root: Root = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "Test" }]
        }
      ]
    };
    
    const result = await mdastStringify(root);
    expect(result).toContain("# Test");
  });

  test("mdastStringify with empty root", async () => {
    const result = await mdastStringify(null as any);
    expect(result).toBe("");
  });

  test("unifiedVisit with visitor function", async () => {
    const root: Root = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "Header" }]
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "Content" }]
        }
      ]
    };

    const headings: Heading[] = [];
    await unifiedVisit(root, (node) => {
      if (node.type === "heading") {
        headings.push(node as Heading);
      }
    });

    expect(headings).toHaveLength(1);
    expect(headings[0].depth).toBe(1);
  });

  test("unifiedVisit with check option", async () => {
    const root: Root = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 2,
          children: [{ type: "text", value: "Title" }]
        }
      ]
    };

    const texts: Text[] = [];
    await unifiedVisit(root, (node) => {
      texts.push(node as Text);
    }, { check: "text" });

    expect(texts).toHaveLength(1);
    expect(texts[0].value).toBe("Title");
  });

  test("unifiedVisit with null root", async () => {
    const result = await unifiedVisit(null as any, () => {});
    expect(result).toBeUndefined();
  });

  test("mdastParse handles markdown with frontmatter", async () => {
    const content = `---
title: Test
---
# Content`;
    
    const result = await mdastParse(content);
    expect(result).toBeDefined();
    expect(result.children.length).toBeGreaterThan(0);
  });

  test("mdastParse handles GFM features", async () => {
    const content = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

- [x] Task 1
- [ ] Task 2`;
    
    const result = await mdastParse(content);
    expect(result).toBeDefined();
    expect(result.children.length).toBeGreaterThan(0);
  });
});