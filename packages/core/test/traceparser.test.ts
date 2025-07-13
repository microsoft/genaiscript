// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { parseTraceTree, renderTraceTree, TraceNode } from "../src/traceparser.js";

describe("traceparser", () => {
  test("parseTraceTree - empty text returns root node", () => {
    const result = parseTraceTree("");
    assert.deepEqual(result.root.type, "details");
    assert.deepEqual(result.root.label, "trace");
    assert.deepEqual(result.root.content, [""]);
  });

  test("parseTraceTree - parses basic details structure", () => {
    const input = `<details>
<summary>Test Details</summary>
Some content
</details>`;
    const result = parseTraceTree(input);
    const firstDetails = result.root.content[0] as any;
    assert.equal(firstDetails.type, "details");
    assert.equal(firstDetails.label, "Test Details");
    assert.equal(firstDetails.content[0], "Some content");
  });

  test("parseTraceTree - handles nested details", () => {
    const input = `<details>
<summary>Parent</summary>
<details>
<summary>Child</summary>
Nested content
</details>
</details>`;
    const result = parseTraceTree(input);
    console.log(JSON.stringify(result, null, 2));
    const parent = result.root.content[0] as any;
    const child = parent.content[0] as any;
    assert.equal(parent.label, "Parent");
    assert.equal(child.label, "Child");
    assert.equal(child.content[0], "Nested content");
  });

  test("parseTraceTree - parses items when enabled", () => {
    const input = `<details>
<summary>With Items</summary>
- key: value
- another: item
</details>`;
    const result = parseTraceTree(input, { parseItems: true });
    const details = result.root.content[0] as any;
    assert.equal(details.content[0].type, "item");
    assert.equal(details.content[0].label, "key");
    assert.equal(details.content[0].value, "value");
  });

  test("renderTraceTree - renders details node", () => {
    const node: TraceNode = {
      type: "details",
      label: "Test",
      content: ["Content"],
    };
    const result = renderTraceTree(node, 1);
    assert(result.includes("<details>"));
    assert(result.includes("<summary>Test</summary>"));
    assert(result.includes("Content"));
  });

  test("renderTraceTree - renders item node", () => {
    const node: TraceNode = {
      type: "item",
      label: "key",
      value: "value",
    };
    const result = renderTraceTree(node, 1);
    assert.equal(result, "- key: value");
  });

  test("renderTraceTree - handles string nodes", () => {
    const result = renderTraceTree("Plain text", 1);
    assert.equal(result, "Plain text");
  });
  test("parseTraceTree - handles unbalanced details tags", () => {
    const input = `<details>
<summary>Test</summary>
Content
</details>
</details>
</details>`;
    const result = parseTraceTree(input);
    const details = result.root.content[0] as any;
    assert.equal(details.type, "details");
    assert.equal(details.label, "Test");
    assert.equal(details.content[0], "Content");
    // Extra closing tags should be ignored
    assert.equal(result.root.content.length, 1);
  });
});
