// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from "vitest";
import { remark } from "remark";
import remarkDetails, { type DetailsElement } from "../src/remarkdetails.js";
import type { Root, RootContent } from "mdast";

describe("remarkDetails", () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const createProcessor = () => remark().use(remarkDetails);

  it("should parse simple details element without summary", async () => {
    const input = `<details>
This is the content of the details element.
</details>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    expect(tree.children).toHaveLength(1);
    const detailsNode = tree.children[0] as unknown as DetailsElement;
    expect(detailsNode.type).toBe("detailsElement");
    expect(detailsNode.data?.detailsElement?.summary).toBe("");
    expect(detailsNode.data?.detailsElement?.content).toContain("This is the content");
  });

  it("should parse details element with summary", async () => {
    const input = `<details>
<summary>Click to expand</summary>
This is the hidden content.
</details>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    expect(tree.children).toHaveLength(1);
    const detailsNode = tree.children[0] as unknown as DetailsElement;
    expect(detailsNode.type).toBe("detailsElement");
    expect(detailsNode.data?.detailsElement?.summary).toBe("Click to expand");
    expect(detailsNode.data?.detailsElement?.content).toContain("This is the hidden content");
    
    // Should have summary node and content nodes as children
    expect(detailsNode.children.length).toBeGreaterThan(0);
    const summaryChild = detailsNode.children[0];
    expect(summaryChild.type).toBe("summaryElement");
  });

  it("should parse details with markdown content", async () => {
    const input = `<details>
<summary>Markdown Example</summary>

## Header

- List item 1
- List item 2

**Bold text**
</details>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    expect(tree.children).toHaveLength(1);
    const detailsNode = tree.children[0] as unknown as DetailsElement;
    expect(detailsNode.type).toBe("detailsElement");
    expect(detailsNode.data?.detailsElement?.summary).toBe("Markdown Example");
    
    // Should have parsed the markdown content into proper nodes
    expect(detailsNode.children.length).toBeGreaterThan(1);
    const summaryChild = detailsNode.children[0];
    expect(summaryChild.type).toBe("summaryElement");
    
    // Should have heading and list nodes from the markdown content
    const hasHeading = detailsNode.children.some((child: RootContent) => child.type === "heading");
    const hasList = detailsNode.children.some((child: RootContent) => child.type === "list");
    expect(hasHeading).toBe(true);
    expect(hasList).toBe(true);
  });

  it("should handle details with attributes", async () => {
    const input = `<details open class="custom-details">
<summary>Open by default</summary>
Content here
</details>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    expect(tree.children).toHaveLength(1);
    const detailsNode = tree.children[0] as unknown as DetailsElement;
    expect(detailsNode.type).toBe("detailsElement");
    expect(detailsNode.data?.detailsElement?.summary).toBe("Open by default");
  });

  it("should not parse non-details HTML", async () => {
    const input = `<div>
<p>This is not a details element</p>
</div>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    expect(tree.children).toHaveLength(1);
    const htmlNode = tree.children[0] as RootContent;
    expect(htmlNode.type).toBe("html");
    expect((htmlNode as { value: string }).value).toContain("<div>");
  });

  it("should handle empty details", async () => {
    const input = `<details>
</details>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    expect(tree.children).toHaveLength(1);
    const detailsNode = tree.children[0] as unknown as DetailsElement;
    expect(detailsNode.type).toBe("detailsElement");
    expect(detailsNode.data?.detailsElement?.summary).toBe("");
    expect(detailsNode.data?.detailsElement?.content).toBe("");
  });
});
