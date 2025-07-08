// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, beforeEach } from "vitest";
import { mdast } from "../src/unified.js";
import { initialize } from "@genaiscript/runtime";
import type { Blockquote } from "mdast";

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
      expect(output).toContain('<Alert type="info">');
      expect(output).toContain("[a link](https://example.com)");
      expect(output).toContain("## Code Examples");
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
      const blockquote = ast.children[0] as Blockquote & { data?: { githubAlert?: { type: string } } };
      expect(blockquote.type).toBe("blockquote");
      expect(blockquote.data?.githubAlert?.type).toBe("NOTE");
      
      // Check stringify output contains escaped brackets (current behavior)
      console.log(api.inspect(ast))
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
});
