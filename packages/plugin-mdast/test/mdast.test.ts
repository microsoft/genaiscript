import { describe, test, expect } from "vitest";
import { mdast } from "../src/unified.js";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

describe("mdast", () => {
  test("should load and expose parse, stringify, and visit utilities", async () => {
    const api = await mdast();
    expect(typeof api.parse).toBe("function");
    expect(typeof api.stringify).toBe("function");
    expect(typeof api.visit).toBe("function");
    expect(typeof api.visitParents).toBe("function");
    expect(api.CONTINUE).toBeDefined();
    expect(api.EXIT).toBeDefined();
    expect(api.SKIP).toBeDefined();
  });

  test("parse returns empty root for empty string", async () => {
    const api = await mdast();
    const ast = api.parse("");
    expect(ast).toEqual({ type: "root", children: [] });
  });

  test("parse returns empty root for empty WorkspaceFile", async () => {
    const api = await mdast();
    const ast = api.parse({ filename: "foo.md", content: "" });
    expect(ast).toEqual({ type: "root", children: [] });
  });

  test("parse returns AST for markdown string", async () => {
    const api = await mdast();
    const ast = api.parse("# Hello\n\nThis is a test.");
    expect(ast.type).toBe("root");
    expect(Array.isArray(ast.children)).toBe(true);
    expect(ast.children.some((n: any) => n.type === "heading")).toBe(true);
  });

  test("stringify returns empty string for empty root", async () => {
    const api = await mdast();
    const result = api.stringify({ type: "root", children: [] });
    expect(result).toBe("");
  });

  test("stringify returns markdown for AST", async () => {
    const api = await mdast();
    const ast = api.parse("# Title\n\nSome text.");
    const md = api.stringify(ast);
    expect(md).toContain("# Title");
    expect(md).toContain("Some text.");
  });

  test("parse and stringify roundtrip", async () => {
    const api = await mdast();
    const input = "# Heading\n\n- item 1\n- item 2";
    const ast = api.parse(input);
    const output = api.stringify(ast);
    expect(output).toContain("Heading");
    expect(output).toContain("item 1");
    expect(output).toContain("item 2");
  });

  test("visit traverses AST nodes", async () => {
    const api = await mdast();
    const ast = api.parse("# Heading\n\nText");
    const nodes: string[] = [];
    api.visit(ast, (node: any) => {
      if (node.type) nodes.push(node.type);
    });
    expect(nodes).toContain("root");
    expect(nodes).toContain("heading");
    expect(nodes).toContain("text");
  });
});
