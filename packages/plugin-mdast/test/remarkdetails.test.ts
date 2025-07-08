// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from "vitest";
import { remark } from "remark";
import remarkDetails, { type DetailsElement } from "../src/remarkdetails.js";
import type { Root, RootContent } from "mdast";
import { inspect } from "unist-util-inspect";

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
    expect(detailsNode.data?.detailsElement?.summary).toBe(undefined);
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
    const input = `<details><summary>Markdown Example</summary>

    ## Header

- List item 1
- List item 2

**Bold text**

</details>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    console.log(inspect(tree));
    expect(tree.children).toHaveLength(5);
    const detailsNode = tree.children[0] as unknown as DetailsElement;
    expect(detailsNode.type).toBe("html");
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
    expect(detailsNode.data?.detailsElement?.summary).toBe(undefined);
    expect(detailsNode.data?.detailsElement?.content).toBe("");
  });

  it("should handle lists", async () => {
    const input = `<details>
<summary>🎒 Other Courses</summary>

- [Generative AI for Beginners](https://aka.ms/genai-beginners)
- [Generative AI for Beginners .NET](https://github.com/microsoft/Generative-AI-for-beginners-dotnet)
</details>`;

    const processor = createProcessor();
    const result = processor.parse(input);
    const tree = processor.runSync(result) as Root;

    console.log(inspect(tree));
  });
});
