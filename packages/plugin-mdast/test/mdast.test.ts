// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, beforeEach } from "vitest";
import { mdast } from "../src/unified.js";
import { initialize } from "@genaiscript/runtime";
import type { Blockquote } from "mdast";
import { readFile } from "fs/promises";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

describe("mdast", () => {
  beforeEach(async () => {
    await initialize({ test: true });
  });
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
    const ast = await api.parse("");
    expect(ast).toEqual({ type: "root", children: [] });
  });

  test("parse returns empty root for empty WorkspaceFile", async () => {
    const api = await mdast();
    const ast = await api.parse({ filename: "foo.md", content: "" });
    expect(ast).toEqual({ type: "root", children: [] });
  });

  test("parse returns AST for markdown string", async () => {
    const api = await mdast();
    const ast = await api.parse("# Hello\n\nThis is a test.");
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
    const ast = await api.parse("# Title\n\nSome text.");
    const md = api.stringify(ast);
    expect(md).toContain("# Title");
    expect(md).toContain("Some text.");
  });

  test("parse and stringify roundtrip", async () => {
    const api = await mdast();
    const input = "# Heading\n\n- item 1\n- item 2";
    const ast = await api.parse(input);
    const output = api.stringify(ast);
    expect(output).toContain("Heading");
    expect(output).toContain("item 1");
    expect(output).toContain("item 2");
  });

  test("visit traverses AST nodes", async () => {
    const api = await mdast();
    const ast = await api.parse("# Heading\n\nText");
    const nodes: string[] = [];
    api.visit(ast, (node: any) => {
      if (node.type) nodes.push(node.type);
    });
    expect(nodes).toContain("root");
    expect(nodes).toContain("heading");
    expect(nodes).toContain("text");
  });

  describe("markdown syntax features", () => {
    test("parse and stringify headers (h1-h6)", async () => {
      const api = await mdast();
      const input = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# H1");
      expect(output).toContain("## H2");
      expect(output).toContain("### H3");
      expect(output).toContain("#### H4");
      expect(output).toContain("##### H5");
      expect(output).toContain("###### H6");
    });

    test("parse and stringify emphasis (bold, italic)", async () => {
      const api = await mdast();
      const input = "**bold text** and *italic text*";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("**bold text**");
      expect(output).toContain("*italic text*");
    });

    test("parse and stringify unordered lists", async () => {
      const api = await mdast();
      const input = "- Item 1\n- Item 2\n  - Nested item\n- Item 3";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("* Item 1");
      expect(output).toContain("* Item 2");
      expect(output).toContain("* Nested item");
      expect(output).toContain("* Item 3");
    });

    test("parse and stringify ordered lists", async () => {
      const api = await mdast();
      const input = "1. First item\n2. Second item\n   1. Nested item\n3. Third item";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("1. First item");
      expect(output).toContain("2. Second item");
      expect(output).toContain("1. Nested item");
      expect(output).toContain("3. Third item");
    });

    test("parse and stringify links", async () => {
      const api = await mdast();
      const input =
        "[Link text](https://example.com) and [Reference link][ref]\n\n[ref]: https://reference.com";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("[Link text](https://example.com)");
      expect(output).toContain("[Reference link][ref]");
      expect(output).toContain("[ref]: https://reference.com");
    });

    test("parse and stringify images", async () => {
      const api = await mdast();
      const input = "![Alt text](image.jpg) and ![Reference image][img]\n\n[img]: reference.jpg";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("![Alt text](image.jpg)");
      expect(output).toContain("![Reference image][img]");
      expect(output).toContain("[img]: reference.jpg");
    });

    test("parse and stringify inline code", async () => {
      const api = await mdast();
      const input = "Here is some `inline code` in a sentence.";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("`inline code`");
    });

    test("parse and stringify code blocks", async () => {
      const api = await mdast();
      const input = "```javascript\nconst x = 1;\nconsole.log(x);\n```";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("```javascript");
      expect(output).toContain("const x = 1;");
      expect(output).toContain("console.log(x);");
      expect(output).toContain("```");
    });

    test("parse and stringify blockquotes", async () => {
      const api = await mdast();
      const input = "> This is a blockquote\n> with multiple lines\n>\n> And another paragraph";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("> This is a blockquote");
      expect(output).toContain("> with multiple lines");
      expect(output).toContain("> And another paragraph");
    });

    test("parse and stringify horizontal rules", async () => {
      const api = await mdast();
      const input = "Before\n\n---\n\nAfter";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("Before");
      expect(output).toContain("***");
      expect(output).toContain("After");
    });

    test("parse and stringify tables", async () => {
      const api = await mdast();
      const input =
        "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("Header 1");
      expect(output).toContain("Header 2");
      expect(output).toContain("Cell 1");
      expect(output).toContain("Cell 2");
      expect(output).toContain("Cell 3");
      expect(output).toContain("Cell 4");
    });

    test("parse and stringify line breaks", async () => {
      const api = await mdast();
      const input = "Line 1  \nLine 2\n\nParagraph 2";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("Line 1");
      expect(output).toContain("Line 2");
      expect(output).toContain("Paragraph 2");
    });

    test("parse and stringify autolinks", async () => {
      const api = await mdast();
      const input = "Visit <https://example.com> or email <user@example.com>";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<https://example.com>");
      expect(output).toContain("<user@example.com>");
    });

    test("parse and stringify footnotes", async () => {
      const api = await mdast();
      const input = "Here is a footnote reference[^1].\n\n[^1]: This is the footnote.";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("footnote reference[^1]");
      expect(output).toContain("[^1]: This is the footnote");
    });

    test("parse and stringify task lists", async () => {
      const api = await mdast();
      const input = "- [x] Completed task\n- [ ] Incomplete task\n- [X] Another completed task";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("* [x] Completed task");
      expect(output).toContain("* [ ] Incomplete task");
      expect(output).toContain("* [x] Another completed task");
    });

    test("parse and stringify definition lists", async () => {
      const api = await mdast();
      const input = "Term 1\n: Definition 1\n\nTerm 2\n: Definition 2a\n: Definition 2b";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      // Note: Definition lists might not be supported in all markdown parsers
      // This test verifies the parser handles them gracefully
      expect(ast.type).toBe("root");
      expect(Array.isArray(ast.children)).toBe(true);
    });

    test("parse and stringify math expressions", async () => {
      const api = await mdast();
      const input =
        "Inline math: $E = mc^2$ and block math:\n\n$$\n\\int_0^\\infty e^{-x} dx = 1\n$$";
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      // Math support depends on plugins, this tests graceful handling
      expect(ast.type).toBe("root");
      expect(output).toContain("E = mc^2");
      expect(output).toContain("\\int_0^\\infty");
    });

    test("visit with type filter", async () => {
      const api = await mdast();
      const input = "# Heading\n\nParagraph with **bold** and *italic* text.";
      const ast = await api.parse(input);
      const headings: any[] = [];
      const emphasis: any[] = [];

      api.visit(ast, "heading", (node: any) => {
        headings.push(node);
      });

      api.visit(ast, ["strong", "emphasis"], (node: any) => {
        emphasis.push(node);
      });

      expect(headings).toHaveLength(1);
      expect(headings[0].depth).toBe(1);
      expect(emphasis.length).toBeGreaterThan(0);
    });

    test("visit with SKIP and EXIT controls", async () => {
      const api = await mdast();
      const input = "# Title\n\n**Bold** text\n\n## Subtitle";
      const ast = await api.parse(input);
      const visited: string[] = [];

      api.visit(ast, (node: any) => {
        visited.push(node.type);

        if (node.type === "heading" && node.depth === 1) {
          return api.SKIP; // Skip children of h1
        }

        if (node.type === "strong") {
          return api.EXIT; // Stop visiting entirely
        }
      });

      expect(visited).toContain("root");
      expect(visited).toContain("heading");
      expect(visited).toContain("strong");
      // Should not contain nodes after the strong element due to EXIT
    });
    test("parse and stringify mixed content", async () => {
      const api = await mdast();
      const input = `# Main Title

This is a paragraph with **bold** and *italic* text.

## Section

- List item with [link](https://example.com)
- Another item with \`inline code\`

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

> A blockquote with **emphasis**.

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |`;

      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# Main Title");
      expect(output).toContain("**bold**");
      expect(output).toContain("*italic*");
      expect(output).toContain("## Section");
      expect(output).toContain("[link](https://example.com)");
      expect(output).toContain("`inline code`");
      expect(output).toContain("```python");
      expect(output).toContain("def hello():");
      expect(output).toContain("> A blockquote");
      expect(output).toContain("Column 1");
      expect(output).toContain("Data 1");
    });

    test("parse handles malformed markdown gracefully", async () => {
      const api = await mdast();
      const input = "# Heading\n\n[Incomplete link\n\n```\nUnclosed code block";
      const ast = await api.parse(input);

      expect(ast.type).toBe("root");
      expect(Array.isArray(ast.children)).toBe(true);

      const output = api.stringify(ast);
      expect(output).toContain("Heading");
    });

    test("visit traverses complex AST structure", async () => {
      const api = await mdast();
      const input = "# Title\n\n**Bold** text with [link](url)\n\n- List item";
      const ast = await api.parse(input);
      const nodeTypes: string[] = [];

      api.visit(ast, (node: any) => {
        if (node.type) nodeTypes.push(node.type);
      });

      expect(nodeTypes).toContain("root");
      expect(nodeTypes).toContain("heading");
      expect(nodeTypes).toContain("paragraph");
      expect(nodeTypes).toContain("strong");
      expect(nodeTypes).toContain("link");
      expect(nodeTypes).toContain("list");
      expect(nodeTypes).toContain("listItem");
      expect(nodeTypes).toContain("text");
    });

    test("visitParents provides parent information", async () => {
      const api = await mdast();
      const input = "# Title\n\n**Bold text**";
      const ast = await api.parse(input);
      const visits: Array<{ type: string; parentTypes: string[] }> = [];

      api.visitParents(ast, (node: any, parents: any[]) => {
        visits.push({
          type: node.type,
          parentTypes: parents.map((p) => p.type),
        });
      });

      const strongVisit = visits.find((v) => v.type === "strong");
      expect(strongVisit).toBeDefined();
      expect(strongVisit?.parentTypes).toContain("paragraph");
      expect(strongVisit?.parentTypes).toContain("root");
    });
  });

  describe("MDX syntax features", () => {
    test("parse and stringify JSX components", async () => {
      const api = await mdast({ mdx: true });
      const input = `# Title

<Button>Click me</Button>

<Card title="Hello">
  Content here
</Card>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# Title");
      expect(output).toContain("<Button>Click me</Button>");
      expect(output).toContain('<Card title="Hello">');
      expect(output).toContain("Content here");
      expect(output).toContain("</Card>");
    });

    test("parse and stringify self-closing JSX components", async () => {
      const api = await mdast();
      const input = `<Image src="image.jpg" alt="Description" />

<br />

<Hr className="my-4" />`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain('<Image src="image.jpg" alt="Description" />');
      expect(output).toContain("<br />");
      expect(output).toContain('<Hr className="my-4" />');
    });

    test("parse and stringify JSX expressions", async () => {
      const api = await mdast({ mdx: true });
      const input = `# Dynamic Content

Today is {new Date().toLocaleDateString()}

The answer is {2 + 2}

<div>
  {items.map(item => <span key={item.id}>{item.name}</span>)}
</div>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# Dynamic Content");
      expect(output).toContain("{new Date().toLocaleDateString()}");
      expect(output).toContain("{2 + 2}");
      expect(output).toContain("{items.map(item => <span key={item.id}>{item.name}</span>)}");
    });

    test("parse and stringify JSX with props", async () => {
      const api = await mdast();
      const input = `<Alert type="warning" dismissible={true} onClose={handleClose}>
  This is a warning message
</Alert>

<Table 
  data={tableData} 
  columns={["Name", "Age", "City"]}
  sortable
/>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain('<Alert type="warning" dismissible={true} onClose={handleClose}>');
      expect(output).toContain("This is a warning message");
      expect(output).toContain("</Alert>");
      expect(output).toContain("<Table");
      expect(output).toContain("data={tableData}");
      expect(output).toContain('columns={["Name", "Age", "City"]}');
      expect(output).toContain("sortable");
      expect(output).toContain("/>");
    });

    test("parse and stringify nested JSX components", async () => {
      const api = await mdast({ mdx: true });
      const input = `<Layout>
  <Header>
    <Navigation />
  </Header>
  <Main>
    <Section>
      <Article>
        # Article Title
        
        This is regular markdown content inside JSX.
        
        <Callout type="info">
          **Important note** with *emphasis*.
        </Callout>
      </Article>
    </Section>
  </Main>
</Layout>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<Layout>");
      expect(output).toContain("<Header>");
      expect(output).toContain("<Navigation />");
      expect(output).toContain("# Article Title");
      expect(output).toContain("This is regular markdown content inside JSX.");
      expect(output).toContain('<Callout type="info">');
      expect(output).toContain("**Important note**");
      expect(output).toContain("*emphasis*");
      expect(output).toContain("</Callout>");
      expect(output).toContain("</Layout>");
    });

    test("parse and stringify MDX imports and exports", async () => {
      const api = await mdast({ mdx: true });
      const input = `import { Button } from './components/Button'
import Chart from './Chart.jsx'

export const title = "My Document"
export { metadata } from './metadata'

# {title}

<Button>Click me</Button>

<Chart data={chartData} />`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("import { Button } from './components/Button'");
      expect(output).toContain("import Chart from './Chart.jsx'");
      expect(output).toContain('export const title = "My Document"');
      expect(output).toContain("export { metadata } from './metadata'");
      expect(output).toContain("# {title}");
      expect(output).toContain("<Button>Click me</Button>");
      expect(output).toContain("<Chart data={chartData} />");
    });

    test("parse and stringify JSX with markdown content", async () => {
      const api = await mdast();
      const input = `<div className="content">

# Heading inside JSX

This is **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`javascript
const code = "inside JSX";
\`\`\`

> Blockquote inside JSX

</div>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain('<div className="content">');
      expect(output).toContain("# Heading inside JSX");
      expect(output).toContain("**bold**");
      expect(output).toContain("*italic*");
      expect(output).toContain("* List item 1");
      expect(output).toContain("* List item 2");
      expect(output).toContain("```javascript");
      expect(output).toContain('const code = "inside JSX";');
      expect(output).toContain("> Blockquote inside JSX");
      expect(output).toContain("</div>");
    });

    test("parse and stringify complex MDX expressions", async () => {
      const api = await mdast({ mdx: true });
      const input = `# Data Visualization

Current count: {count}

<div>
  {users.length > 0 ? (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  ) : (
    <p>No users found</p>
  )}
</div>

{/* This is a JSX comment */}

<CustomComponent 
  prop1={complexObject.property}
  prop2={functionCall()}
  prop3={condition ? "value1" : "value2"}
/>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# Data Visualization");
      expect(output).toContain("Current count: {count}");
      expect(output).toContain("{users.length > 0 ? (");
      expect(output).toContain("{users.map(user => (");
      expect(output).toContain("{user.name} - {user.email}");
      expect(output).toContain(") : (");
      expect(output).toContain("<p>No users found</p>");
      expect(output).toContain("{/* This is a JSX comment */}");
      expect(output).toContain("prop1={complexObject.property}");
      expect(output).toContain("prop2={functionCall()}");
      expect(output).toContain('prop3={condition ? "value1" : "value2"}');
    });

    test("parse and stringify MDX with HTML attributes", async () => {
      const api = await mdast({ mdx: true });
      const input = `<div 
  id="main-content" 
  className="container mx-auto" 
  style={{backgroundColor: 'red', padding: '20px'}}
  data-testid="content"
  onClick={handleClick}
>
  # Content with HTML attributes
  
  <span style={{color: 'blue', fontSize: '18px'}}>Styled text</span>
</div>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<div");
      expect(output).toContain('id="main-content"');
      expect(output).toContain('className="container mx-auto"');
      expect(output).toContain("style={{backgroundColor: 'red', padding: '20px'}}");
      expect(output).toContain('data-testid="content"');
      expect(output).toContain("{handleClick}");
      expect(output).toContain("# Content with HTML attributes");
      expect(output).toContain("style={{color: 'blue', fontSize: '18px'}}");
      expect(output).toContain("Styled text");
    });

    test("parse and stringify mixed markdown and MDX content", async () => {
      const api = await mdast({ mdx: true });
      const input = `# Main Title

Regular markdown paragraph with **bold** text.

<Alert type="info">
  This is an info alert with [a link](https://example.com).
</Alert>

## Code Examples

Here's some regular markdown code:

\`\`\`javascript
const regular = "markdown";
\`\`\`

And here's a JSX code block:

<CodeBlock language="jsx">
  {\`
    const Component = () => {
      return <div>Hello World</div>;
    };
  \`}
</CodeBlock>

| Regular | Markdown | Table |
|---------|----------|-------|
| Cell 1  | Cell 2   | Cell 3|

<Table>
  <thead>
    <tr>
      <th>JSX</th>
      <th>Table</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell A</td>
      <td>Cell B</td>
    </tr>
  </tbody>
</Table>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# Main Title");
      expect(output).toContain("**bold**");
      expect(output).toContain("## Code Examples"); // Remove *italic* since it's not in the input
      expect(output).toContain("[a link](https://example.com)");
      expect(output).toContain("```javascript");
      expect(output).toContain('<CodeBlock language="jsx">');
      expect(output).toContain("Regular | Markdown | Table");
      expect(output).toContain("Cell 1  | Cell 2   | Cell 3");
      expect(output).toContain("<Table>");
      expect(output).toContain("<thead>");
      expect(output).toContain("<th>JSX</th>");
      expect(output).toContain("<td>Cell A</td>");
    });

    test("visit traverses MDX AST nodes", async () => {
      const api = await mdast();
      const input = `# Title

<Component prop={value}>
  Content with {expression}
</Component>`;
      const ast = await api.parse(input);
      const nodeTypes: string[] = [];

      api.visit(ast, (node: any) => {
        if (node.type) nodeTypes.push(node.type);
      });

      expect(nodeTypes).toContain("root");
      expect(nodeTypes).toContain("heading");
      expect(nodeTypes).toContain("text");
      // MDX-specific nodes might include mdxJsxFlowElement, mdxJsxTextElement, etc.
      // The exact node types depend on the MDX parser implementation
    });
  });

  describe("GitHub alerts", () => {
    test("parse NOTE alerts and detect alert metadata", async () => {
      const api = await mdast();
      const input = `> [!NOTE]
> This is a note alert with **bold** text.`;
      const ast = await api.parse(input);

      // Check that the alert is properly detected in the AST
      const blockquote = ast.children[0] as Blockquote & {
        data?: { githubAlert?: { type: string } };
      };
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("NOTE");

      // Check stringify output contains escaped brackets (current behavior)
      console.log(api.inspect(ast));
      const output = api.stringify(ast);
      expect(output).toContain("> [!NOTE]");
      expect(output).toContain("> This is a note alert with **bold** text.");
    });

    test("parse WARNING alerts and detect alert metadata", async () => {
      const api = await mdast();
      const input = `> [!WARNING]
> This is a warning alert.`;
      const ast = await api.parse(input);

      const blockquote = ast.children[0] as any;
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("WARNING");

      const output = api.stringify(ast);
      expect(output).toContain("> [!WARNING]");
      expect(output).toContain("> This is a warning alert.");
    });

    test("parse IMPORTANT alerts and detect alert metadata", async () => {
      const api = await mdast();
      const input = `> [!IMPORTANT]
> This is an important alert.`;
      const ast = await api.parse(input);

      const blockquote = ast.children[0] as any;
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("IMPORTANT");

      const output = api.stringify(ast);
      expect(output).toContain("> [!IMPORTANT]");
      expect(output).toContain("> This is an important alert.");
    });

    test("parse TIP alerts and detect alert metadata", async () => {
      const api = await mdast();
      const input = `> [!TIP]
> Here's a useful tip for you.`;
      const ast = await api.parse(input);

      const blockquote = ast.children[0] as any;
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("TIP");

      const output = api.stringify(ast);
      expect(output).toContain("> [!TIP]");
      expect(output).toContain("> Here's a useful tip for you.");
    });

    test("parse CAUTION alerts and detect alert metadata", async () => {
      const api = await mdast();
      const input = `> [!CAUTION]
> Be careful with this operation.`;
      const ast = await api.parse(input);

      const blockquote = ast.children[0] as any;
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("CAUTION");

      const output = api.stringify(ast);
      expect(output).toContain("> [!CAUTION]");
      expect(output).toContain("> Be careful with this operation.");
    });

    test("parse alerts with complex content", async () => {
      const api = await mdast();
      const input = `> [!NOTE]
> This alert contains:
> 
> - A list item
> - Another item with [a link](https://example.com)`;
      const ast = await api.parse(input);

      const blockquote = ast.children[0] as any;
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("NOTE");

      const output = api.stringify(ast);
      expect(output).toContain("> [!NOTE]");
      expect(output).toContain("> This alert contains:");
      expect(output).toContain("> * A list item");
      expect(output).toContain("> * Another item with [a link](https://example.com)");
    });

    test("parse multiple alerts in document", async () => {
      const api = await mdast();
      const input = `# Document with Alerts

> [!NOTE]
> First alert.

> [!WARNING]
> Second alert.`;
      const ast = await api.parse(input);

      // Check both alerts are detected
      const noteBlockquote = ast.children[1] as any;
      const warningBlockquote = ast.children[2] as any;

      expect(noteBlockquote.data?.githubAlert?.type).toBe("NOTE");
      expect(warningBlockquote.data?.githubAlert?.type).toBe("WARNING");

      const output = api.stringify(ast);
      expect(output).toContain("# Document with Alerts");
      expect(output).toContain("> [!NOTE]");
      expect(output).toContain("> First alert.");
      expect(output).toContain("> [!WARNING]");
      expect(output).toContain("> Second alert.");
    });

    test("parse alerts with custom titles", async () => {
      const api = await mdast();
      const input = `> [!NOTE] Custom Note Title
> This note has a custom title.`;
      const ast = await api.parse(input);

      const blockquote = ast.children[0] as any;
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("NOTE");

      const output = api.stringify(ast);
      expect(output).toContain("> [!NOTE] Custom Note Title");
      expect(output).toContain("> This note has a custom title.");
    });

    test("visit traverses alert nodes", async () => {
      const api = await mdast();
      const input = `> [!NOTE]
> This is an alert with **bold** text.`;
      const ast = await api.parse(input);
      const nodeTypes: string[] = [];

      api.visit(ast, (node) => {
        if (node.type) nodeTypes.push(node.type);
      });

      expect(nodeTypes).toContain("root");
      expect(nodeTypes).toContain("blockquote");
      expect(nodeTypes).toContain("paragraph");
      expect(nodeTypes).toContain("text");
      expect(nodeTypes).toContain("strong");
    });

    test("parse mixed blockquotes and alerts", async () => {
      const api = await mdast();
      const input = `> Regular blockquote text.

> [!NOTE]
> This is an alert.

> Another regular blockquote.
> With multiple lines.`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("> Regular blockquote text.");
      expect(output).toContain("> [!NOTE]");
      expect(output).toContain("> This is an alert.");
      expect(output).toContain("> Another regular blockquote.");
      expect(output).toContain("> With multiple lines.");
    });
  });

  describe("HTML details elements", () => {
    test("parse and stringify basic details element", async () => {
      const api = await mdast();
      const input = `<details>
<summary>Click to expand</summary>

This is the content inside the details element.
</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<details>");
      expect(output).toContain("<summary>Click to expand</summary>");
      expect(output).toContain("This is the content inside the details element.");
      expect(output).toContain("</details>");
    });

    test("parse and stringify details with markdown content", async () => {
      const api = await mdast();
      const input = `<details>
<summary>Markdown Content</summary>

# Heading inside details

This is **bold** and *italic* text inside a details element.

- List item 1
- List item 2

\`\`\`javascript
const code = "inside details";
console.log(code);
\`\`\`

> Blockquote inside details

</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<details>");
      expect(output).toContain("<summary>Markdown Content</summary>");
      expect(output).toContain("# Heading inside details");
      expect(output).toContain("**bold**");
      expect(output).toContain("*italic*");
      expect(output).toContain("* List item 1");
      expect(output).toContain("* List item 2");
      expect(output).toContain("```javascript");
      expect(output).toContain('const code = "inside details";');
      expect(output).toContain("> Blockquote inside details");
      expect(output).toContain("</details>");
    });

    test("parse and stringify details with tables", async () => {
      const api = await mdast();
      const input = `<details>
<summary>Data Table</summary>

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data A   | Value X  |
| Row 2    | Data B   | Value Y  |

</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<details>");
      expect(output).toContain("<summary>Data Table</summary>");
      expect(output).toContain("Column 1");
      expect(output).toContain("Column 2");
      expect(output).toContain("Column 3");
      expect(output).toContain("Row 1");
      expect(output).toContain("Data A");
      expect(output).toContain("Value X");
      expect(output).toContain("</details>");
    });

    test("parse and stringify nested details elements", async () => {
      const api = await mdast();
      const input = `<details>
<summary>Outer Details</summary>

Content in outer details.

<details>
<summary>Inner Details</summary>

This is nested content with **emphasis**.

</details>

More content in outer details.

</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<details>");
      expect(output).toContain("<summary>Outer Details</summary>");
      expect(output).toContain("Content in outer details.");
      expect(output).toContain("<summary>Inner Details</summary>");
      expect(output).toContain("**emphasis**");
      expect(output).toContain("More content in outer details.");
      expect(output).toContain("</details>");
    });

    test("parse and stringify details with complex nested markdown", async () => {
      const api = await mdast();
      const input = `# Main Document

<details>
<summary>**API Reference** - Click to view methods</summary>

## Authentication

To authenticate, use the following method:

\`\`\`typescript
const auth = await authenticate({
  apiKey: "your-api-key",
  secret: "your-secret"
});
\`\`\`

## Available Methods

### GET /users

Returns a list of users.

**Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| limit     | number | Max results |
| offset    | number | Skip items  |

**Example Response:**

\`\`\`json
{
  "users": [
    {"id": 1, "name": "John"},
    {"id": 2, "name": "Jane"}
  ]
}
\`\`\`

> **Note**: This endpoint requires authentication.

### POST /users

Creates a new user.

<details>
<summary>Request Example</summary>

\`\`\`json
{
  "name": "New User",
  "email": "user@example.com"
}
\`\`\`

</details>

</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# Main Document");
      expect(output).toContain("<details>");
      expect(output).toContain("<summary>**API Reference** - Click to view methods</summary>");
      expect(output).toContain("## Authentication");
      expect(output).toContain("```typescript");
      expect(output).toContain("const auth = await authenticate");
      expect(output).toContain("## Available Methods");
      expect(output).toContain("### GET /users");
      expect(output).toContain("| Parameter | Type   | Description |");
      expect(output).toContain("```json");
      expect(output).toContain('"users": [');
      expect(output).toContain("> **Note**: This endpoint requires authentication.");
      expect(output).toContain("### POST /users");
      expect(output).toContain("<summary>Request Example</summary>");
      expect(output).toContain('"name": "New User"');
      expect(output).toContain("</details>");
    });

    test("parse and stringify details with GitHub alerts", async () => {
      const api = await mdast();
      const input = `<details>
<summary>Important Information</summary>

> [!WARNING]
> This is a warning inside a details element.

> [!NOTE]
> Additional notes:
> - Point 1
> - Point 2

</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<details>");
      expect(output).toContain("<summary>Important Information</summary>");
      expect(output).toContain("> [!WARNING]");
      expect(output).toContain("> This is a warning inside a details element.");
      expect(output).toContain("> [!NOTE]");
      expect(output).toContain("> Additional notes:");
      expect(output).toContain("> * Point 1");
      expect(output).toContain("> * Point 2");
      expect(output).toContain("</details>");
    });

    test("parse and stringify details with open attribute", async () => {
      const api = await mdast();
      const input = `<details open>
<summary>Always Expanded</summary>

This details element is open by default.

</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("<details open>");
      expect(output).toContain("<summary>Always Expanded</summary>");
      expect(output).toContain("This details element is open by default.");
      expect(output).toContain("</details>");
    });

    test("parse and stringify multiple details elements", async () => {
      const api = await mdast();
      const input = `# FAQ

<details>
<summary>How do I install this?</summary>

Run the following command:

\`\`\`bash
npm install package-name
\`\`\`

</details>

<details>
<summary>How do I configure it?</summary>

Create a config file:

\`\`\`yaml
setting1: value1
setting2: value2
\`\`\`

</details>

<details>
<summary>Troubleshooting</summary>

Common issues:

1. **Problem**: Installation fails
   - Solution: Check Node.js version

2. **Problem**: Config not loading
   - Solution: Verify file path

</details>`;
      const ast = await api.parse(input);
      const output = api.stringify(ast);

      expect(output).toContain("# FAQ");
      expect(output).toContain("<summary>How do I install this?</summary>");
      expect(output).toContain("```bash");
      expect(output).toContain("npm install package-name");
      expect(output).toContain("<summary>How do I configure it?</summary>");
      expect(output).toContain("```yaml");
      expect(output).toContain("setting1: value1");
      expect(output).toContain("<summary>Troubleshooting</summary>");
      expect(output).toContain("1. **Problem**: Installation fails");
      expect(output).toContain("2. **Problem**: Config not loading");
    });

    test("visit traverses details element nodes", async () => {
      const api = await mdast();
      const input = `<details>
<summary>Content</summary>

# Heading

Text with **bold** formatting.

</details>`;
      const ast = await api.parse(input);
      const nodeTypes: string[] = [];

      api.visit(ast, (node) => {
        if (node.type) nodeTypes.push(node.type);
      });

      expect(nodeTypes).toContain("root");
      expect(nodeTypes).toContain("html");
      expect(nodeTypes).toContain("heading");
      expect(nodeTypes).toContain("paragraph");
      expect(nodeTypes).toContain("text");
      expect(nodeTypes).toContain("strong");
    });
  });
});

describe("chunk", () => {
  beforeEach(async () => {
    await initialize({ test: true });
  });

  test("should group nodes by heading", async () => {
    const markdown = `# Heading 1

This is content under heading 1.

## Heading 2

This is content under heading 2.

### Heading 3

This is content under heading 3.

## Another Heading 2

More content here.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 10);

    // Should create chunks based on heading structure
    expect(chunks.length).toBeGreaterThan(1);

    // Check that headings are preserved in chunks
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Heading 1");
    expect(allContent).toContain("## Heading 2");
    expect(allContent).toContain("### Heading 3");
    expect(allContent).toContain("## Another Heading 2");
  });

  test("should handle empty content", async () => {
    const api = await mdast();
    const ast = api.parse("");
    const chunks = api.chunk(ast.children, 10);

    expect(chunks).toEqual([]);
  });

  test("should handle content without headings", async () => {
    const markdown = `This is a paragraph without any headings.

Another paragraph with **bold text** and *italic text*.

- List item 1
- List item 2
- List item 3

> A blockquote without any headings.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 2);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify all content is preserved
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("This is a paragraph without any headings.");
    expect(allContent).toContain("**bold text**");
    expect(allContent).toContain("* List item 1");
    expect(allContent).toContain("> A blockquote without any headings.");
  });

  test("should respect chunk size limits", async () => {
    const markdown = `# Main Heading

Paragraph 1

Paragraph 2

Paragraph 3

Paragraph 4

Paragraph 5`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 3);

    // Each chunk should not exceed the size limit (except for headings)
    chunks.forEach((chunk) => {
      if (chunk.length > 3) {
        // If chunk exceeds limit, it should contain a heading
        const hasHeading = chunk.some((node: any) => node.type === "heading");
        expect(hasHeading).toBe(true);
      }
    });
  });

  test("should keep headings with their content", async () => {
    const markdown = `# Section 1

Content for section 1 with multiple paragraphs.

This is another paragraph under section 1.

# Section 2

Content for section 2.

## Subsection 2.1

Content for subsection 2.1.

# Section 3

Content for section 3.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 5);

    // Verify that all content is preserved across chunks
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });

    // Check that all sections and their content are present
    expect(allContent).toContain("# Section 1");
    expect(allContent).toContain("Content for section 1");
    expect(allContent).toContain("This is another paragraph under section 1");
    expect(allContent).toContain("# Section 2");
    expect(allContent).toContain("Content for section 2");
    expect(allContent).toContain("## Subsection 2.1");
    expect(allContent).toContain("Content for subsection 2.1");
    expect(allContent).toContain("# Section 3");
    expect(allContent).toContain("Content for section 3");

    // Verify that chunks are created (content is being chunked)
    expect(chunks.length).toBeGreaterThan(1);
  });

  test("should handle nested heading hierarchies", async () => {
    const markdown = `# Chapter 1

Introduction to chapter 1.

## Section 1.1

Content for section 1.1.

### Subsection 1.1.1

Content for subsection 1.1.1.

### Subsection 1.1.2

Content for subsection 1.1.2.

## Section 1.2

Content for section 1.2.

# Chapter 2

Introduction to chapter 2.

## Section 2.1

Content for section 2.1.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 4);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify hierarchical structure is maintained
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Chapter 1");
    expect(allContent).toContain("## Section 1.1");
    expect(allContent).toContain("### Subsection 1.1.1");
    expect(allContent).toContain("### Subsection 1.1.2");
    expect(allContent).toContain("## Section 1.2");
    expect(allContent).toContain("# Chapter 2");
    expect(allContent).toContain("## Section 2.1");
  });

  test("should handle code blocks and complex elements", async () => {
    const markdown = `# Code Examples

Here's a simple example:

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## Table Example

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
| Data 3   | Data 4   |

## List Example

- Item 1 with \`inline code\`
- Item 2 with **bold text**
- Item 3 with [link](https://example.com)

> This is a blockquote with some content.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 3);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify all complex elements are preserved
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("```javascript");
    expect(allContent).toContain("function hello()");
    expect(allContent).toContain("Column 1 | Column 2");
    expect(allContent).toContain("Data 1   | Data 2");
    expect(allContent).toContain("* Item 1 with `inline code`");
    expect(allContent).toContain("[link](https://example.com)");
    expect(allContent).toContain("> This is a blockquote");
  });

  test("should handle very small chunk sizes", async () => {
    const markdown = `# Small Chunks

Paragraph 1

Paragraph 2

Paragraph 3`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 1);

    expect(chunks.length).toBeGreaterThan(1);

    // Even with chunk size 1, content should be preserved
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Small Chunks");
    expect(allContent).toContain("Paragraph 1");
    expect(allContent).toContain("Paragraph 2");
    expect(allContent).toContain("Paragraph 3");
  });

  test("should handle large chunk sizes", async () => {
    const markdown = `# Large Chunk Test

Content 1

Content 2

Content 3

Content 4

Content 5`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 100);

    // With a large chunk size, everything should fit in one chunk
    expect(chunks.length).toBe(1);
    expect(chunks[0].length).toBe(ast.children.length);

    const content = api.stringify({ type: "root", children: chunks[0] });
    expect(content).toContain("# Large Chunk Test");
    expect(content).toContain("Content 5");
  });

  test("should handle mixed content types", async () => {
    const markdown = `# Mixed Content

Regular paragraph.

\`\`\`python
def example():
    return "code block"
\`\`\`

## Subsection

- List item 1
- List item 2

| Table | Data |
|-------|------|
| A     | B    |

> Blockquote content

[Link text](https://example.com)

![Image](image.jpg)

**Bold** and *italic* text.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 4);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify all content types are preserved
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Mixed Content");
    expect(allContent).toContain("```python");
    expect(allContent).toContain("def example():");
    expect(allContent).toContain("## Subsection");
    expect(allContent).toContain("* List item 1");
    expect(allContent).toContain("Table | Data");
    expect(allContent).toContain("> Blockquote content");
    expect(allContent).toContain("[Link text](https://example.com)");
    expect(allContent).toContain("![Image](image.jpg)");
    expect(allContent).toContain("**Bold**");
    expect(allContent).toContain("*italic*");
  });

  test("should handle GitHub alerts in chunks", async () => {
    const markdown = `# Documentation

Regular content before alerts.

> [!NOTE]
> This is a note alert.

> [!WARNING]
> This is a warning alert.

## Section with Alerts

> [!IMPORTANT]
> Important information here.

More regular content.

> [!TIP]
> Helpful tip for users.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 3);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify alerts are preserved in chunks
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Documentation");
    expect(allContent).toContain("> [!NOTE]");
    expect(allContent).toContain("> This is a note alert.");
    expect(allContent).toContain("> [!WARNING]");
    expect(allContent).toContain("> This is a warning alert.");
    expect(allContent).toContain("## Section with Alerts");
    expect(allContent).toContain("> [!IMPORTANT]");
    expect(allContent).toContain("> [!TIP]");
  });

  test("should handle HTML details elements in chunks", async () => {
    const markdown = `# Documentation

<details>
<summary>Click to expand</summary>

Content inside details element.

</details>

## Regular Section

Regular paragraph content.

<details>
<summary>Another details</summary>

More content with **formatting**.

</details>`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 2);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify HTML elements are preserved
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Documentation");
    expect(allContent).toContain("<details>");
    expect(allContent).toContain("<summary>Click to expand</summary>");
    expect(allContent).toContain("Content inside details element.");
    expect(allContent).toContain("</details>");
    expect(allContent).toContain("## Regular Section");
    expect(allContent).toContain("<summary>Another details</summary>");
    expect(allContent).toContain("**formatting**");
  });

  test("should preserve node order across chunks", async () => {
    const markdown = `# First

Content 1

## Second

Content 2

### Third

Content 3

## Fourth

Content 4

# Fifth

Content 5`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 3);

    expect(api.stringify(ast)).toEqual(api.stringify(chunks.flat(1)));

    // Reconstruct content from chunks and verify order
    const reconstructed = chunks.flat(1);
    const reconstructedContent = api.stringify({ type: "root", children: reconstructed });

    // Content should be in the same order
    expect(reconstructedContent.indexOf("# First")).toBeLessThan(
      reconstructedContent.indexOf("## Second"),
    );
    expect(reconstructedContent.indexOf("## Second")).toBeLessThan(
      reconstructedContent.indexOf("### Third"),
    );
    expect(reconstructedContent.indexOf("### Third")).toBeLessThan(
      reconstructedContent.indexOf("## Fourth"),
    );
    expect(reconstructedContent.indexOf("## Fourth")).toBeLessThan(
      reconstructedContent.indexOf("# Fifth"),
    );
  });

  test("should handle single node input", async () => {
    const markdown = `# Single Heading`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 5);

    expect(chunks.length).toBe(1);
    expect(chunks[0].length).toBe(1);
    expect(chunks[0][0].type).toBe("heading");
  });

  test("should handle zero chunk size gracefully", async () => {
    const markdown = `# Test

Content here.`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 0);

    // Should still create chunks, likely treating 0 as minimal chunking
    expect(Array.isArray(chunks)).toBe(true);

    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Test");
    expect(allContent).toContain("Content here.");
  });

  test("long", async () => {
    const markdown = await readFile("./test/long.md", { encoding: "utf-8" });

    const api = await mdast();
    const ast = api.parse(markdown);
    for (let tokens = 10; tokens < 10000; tokens += 250) {
      console.log(`Chunking with ${tokens} tokens`);
      const chunks = api.chunk(ast, tokens);
      console.log(`Chunks created: ${chunks.length}`);
      expect(api.stringify(ast)).toEqual(api.stringify(chunks.flat(1)));
    }
  });

  test("should handle content with only list items", async () => {
    const markdown = `- First item
- Second item  
- Third item with **bold**
- Fourth item with [link](https://example.com)
- Fifth item
- Sixth item`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 2);

    expect(api.stringify(ast)).toEqual(api.stringify(chunks.flat(1)));

    // Should chunk list items appropriately
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("* First item");
    expect(allContent).toContain("* Second item");
    expect(allContent).toContain("* Third item with **bold**");
    expect(allContent).toContain("* Fourth item with [link](https://example.com)");
    expect(allContent).toContain("* Fifth item");
    expect(allContent).toContain("* Sixth item");
  });

  test("should handle alerts", async () => {
    const markdown = `GitHub supports custom alerts in Markdown files, which can be used to highlight important information or warnings. Here are some examples of how to use them:

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
`;

    const api = await mdast();
    const ast = api.parse(markdown);

    console.log(api.inspect(ast));
    expect(api.stringify(ast)).equals(markdown);
  });

  test("should handle deep heading nesting", async () => {
    const markdown = `# Level 1

Content 1

## Level 2

Content 2

### Level 3

Content 3

#### Level 4

Content 4

##### Level 5

Content 5

###### Level 6

Content 6

## Another Level 2

More content`;

    const api = await mdast();
    const ast = api.parse(markdown);
    const chunks = api.chunk(ast.children, 3);

    expect(api.stringify(ast)).toEqual(api.stringify(chunks.flat(1)));

    expect(chunks.length).toBeGreaterThan(1);

    // Verify all heading levels are preserved
    const allContent = api.stringify({ type: "root", children: chunks.flat(1) });
    expect(allContent).toContain("# Level 1");
    expect(allContent).toContain("## Level 2");
    expect(allContent).toContain("### Level 3");
    expect(allContent).toContain("#### Level 4");
    expect(allContent).toContain("##### Level 5");
    expect(allContent).toContain("###### Level 6");
    expect(allContent).toContain("## Another Level 2");
  });
});
