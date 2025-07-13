// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, test, expect, beforeEach } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGitHubAlerts from "../src/remarkalerts.js";
import type { Root } from "mdast";
import { inspect } from "unist-util-inspect";

describe("remarkGitHubAlerts", () => {
  const parseWithPlugin = async (markdown: string): Promise<Root> => {
    const processor = unified().use(remarkParse).use(remarkGitHubAlerts);
    const tree = processor.parse(markdown) as Root;
    const result = await processor.run(tree);
    return result;
  };

  test("should detect and parse NOTE alert", async () => {
    const markdown = `> [!NOTE]
> This is a note alert`;

    const ast = await parseWithPlugin(markdown);
    console.log(inspect(ast));
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert?.type).toBe("NOTE");
  });

  test("should detect and parse all alert types", async () => {
    const alertTypes = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];

    for (const alertType of alertTypes) {
      const markdown = `> [!${alertType}]
> This is a ${alertType.toLowerCase()} alert`;

      const ast = await parseWithPlugin(markdown);
      const blockquote = ast.children[0] as any;

      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe(alertType);
    }
  });

  test("should handle case insensitive alert types", async () => {
    const markdown = `> [!note]
> This is a note alert`;

    const ast = await parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert?.type).toBe("NOTE");
  });

  test("should split content into separate text nodes", async () => {
    const markdown = `> [!NOTE]
> This is a note alert`;

    const ast = await parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;
    const paragraph = blockquote.children[0];
    const textNodes = paragraph.children.filter((child: any) => child.type === "text");

    expect(textNodes.length).toBeGreaterThan(0);

    // Should have at least one text node with content role
    const contentNodes = textNodes.filter(
      (node: any) => node.data?.githubAlert?.role === "content",
    );
    expect(contentNodes.length).toBeGreaterThan(0);
    expect(contentNodes[0].value.trim()).toBe("This is a note alert");
  });

  test("should always preserve syntax and split content", async () => {
    const markdown = `> [!NOTE]
> This is a note alert`;

    const ast = await parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;
    const paragraph = blockquote.children[0];
    const textNodes = paragraph.children.filter((child: any) => child.type === "text");

    // Should have both syntax and content nodes
    const contentNodes = textNodes.filter(
      (node: any) => node.data?.githubAlert?.role === "content",
    );

    expect(contentNodes.length).toBe(1);
    expect(contentNodes[0].value.trim()).toBe("This is a note alert");
  });

  test("should ignore regular blockquotes without alert syntax", async () => {
    const markdown = `> This is a regular blockquote
> without any alert syntax`;

    const ast = await parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert).toBeUndefined();
  });

  test("should ignore blockquotes with invalid alert syntax", async () => {
    const markdown = `> [!INVALID]
> This is not a valid alert type`;

    const ast = await parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert).toBeUndefined();
  });

  test("should handle whitespace variations in alert syntax", async () => {
    const variations = [`> [!NOTE]`, `>   [!NOTE]`, `> [!NOTE] `, `>  [!NOTE]  `];

    for (const syntax of variations) {
      const markdown = `${syntax}
> Alert content`;

      const ast = await parseWithPlugin(markdown);
      const blockquote = ast.children[0] as any;

      expect(blockquote.data?.githubAlert?.type).toBe("NOTE");
    }
  });
});

