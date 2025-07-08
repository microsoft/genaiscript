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
  const parseWithPlugin = (markdown: string): Root => {
    return unified()
      .use(remarkParse)
      .use(remarkGitHubAlerts)
      .parse(markdown) as Root;
  };

  test("should detect and parse NOTE alert", () => {
    const markdown = `> [!NOTE]
> This is a note alert`;

    const ast = parseWithPlugin(markdown);
    console.log(inspect(ast));
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert?.type).toBe("NOTE");
  });

  test("should detect and parse all alert types", () => {
    const alertTypes = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
    
    alertTypes.forEach(alertType => {
      const markdown = `> [!${alertType}]
> This is a ${alertType.toLowerCase()} alert`;

      const ast = parseWithPlugin(markdown);
      const blockquote = ast.children[0] as any;

      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe(alertType);
    });
  });

  test("should handle case insensitive alert types", () => {
    const markdown = `> [!note]
> This is a note alert`;

    const ast = parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert?.type).toBe("NOTE");
  });

  test("should split content into separate text nodes", () => {
    const markdown = `> [!NOTE]
> This is a note alert`;

    const ast = parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;
    const paragraph = blockquote.children[0];
    const textNodes = paragraph.children.filter((child: any) => child.type === "text");

    expect(textNodes.length).toBeGreaterThan(0);
    
    // Should have at least one text node with content role
    const contentNodes = textNodes.filter((node: any) => 
      node.data?.githubAlert?.role === "content"
    );
    expect(contentNodes.length).toBeGreaterThan(0);
    expect(contentNodes[0].value.trim()).toBe("This is a note alert");
  });

  test("should always preserve syntax and split content", () => {
    const markdown = `> [!NOTE]
> This is a note alert`;

    const ast = parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;
    const paragraph = blockquote.children[0];
    const textNodes = paragraph.children.filter((child: any) => child.type === "text");

    // Should have both syntax and content nodes
    const syntaxNodes = textNodes.filter((node: any) => 
      node.data?.githubAlert?.role === "syntax"
    );
    const contentNodes = textNodes.filter((node: any) => 
      node.data?.githubAlert?.role === "content"
    );

    expect(syntaxNodes.length).toBe(1);
    expect(contentNodes.length).toBe(1);
    expect(syntaxNodes[0].value).toBe("[!NOTE]");
    expect(contentNodes[0].value.trim()).toBe("This is a note alert");
  });

  test("should ignore regular blockquotes without alert syntax", () => {
    const markdown = `> This is a regular blockquote
> without any alert syntax`;

    const ast = parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert).toBeUndefined();
  });

  test("should ignore blockquotes with invalid alert syntax", () => {
    const markdown = `> [!INVALID]
> This is not a valid alert type`;

    const ast = parseWithPlugin(markdown);
    const blockquote = ast.children[0] as any;

    expect(blockquote.type).toBe("blockquote");
    expect(blockquote.data?.githubAlert).toBeUndefined();
  });

  test("should handle whitespace variations in alert syntax", () => {
    const variations = [
      `> [!NOTE]`,
      `>   [!NOTE]`,
      `> [!NOTE] `,
      `>  [!NOTE]  `,
    ];

    variations.forEach((syntax) => {
      const markdown = `${syntax}
> Alert content`;

      const ast = parseWithPlugin(markdown);
      const blockquote = ast.children[0] as any;

      expect(blockquote.data?.githubAlert?.type).toBe("NOTE");
    });
  });
});
