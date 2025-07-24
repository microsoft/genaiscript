// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { validateAndRepairMermaidDiagrams } from "../src/repair.js";
import { initialize } from "@genaiscript/runtime";

describe("validateAndRepairMermaidDiagrams", () => {
  beforeEach(async () => {
    await initialize({ test: true });
  });

  const mockParsers = {
    fences: (text: string) => {
      const fenceRegex = /```mermaid\n([\s\S]*?)\n```/g;
      const matches = [];
      let match;
      while ((match = fenceRegex.exec(text)) !== null) {
        matches.push({
          language: "mermaid",
          content: match[1].trim()
        });
      }
      return matches;
    }
  };

  test("should return needsRepair false when no mermaid fences", async () => {
    const assistantText = "This is just text without any mermaid diagrams.";
    const repaired = new Set<string>();
    const result = await validateAndRepairMermaidDiagrams(assistantText, repaired, 3, mockParsers);
    
    assert.strictEqual(result.needsRepair, false);
    assert.strictEqual(result.repairMessage, undefined);
  });

  test("should detect invalid mermaid syntax", async () => {
    const assistantText = `
Here's a diagram:

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B ->|Yes| C[Success]
    C --> D[End]
\`\`\`
`;
    const repaired = new Set<string>();
    const result = await validateAndRepairMermaidDiagrams(assistantText, repaired, 3, mockParsers);
    
    assert.strictEqual(result.needsRepair, true);
    assert.ok(result.repairMessage);
    assert.ok(result.repairMessage.includes("syntax errors"));
  });

  test("should validate correct mermaid syntax", async () => {
    const assistantText = `
Here's a valid diagram:

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Success]
    C --> D[End]
\`\`\`
`;
    const repaired = new Set<string>();
    const result = await validateAndRepairMermaidDiagrams(assistantText, repaired, 3, mockParsers);
    
    assert.strictEqual(result.needsRepair, false);
    assert.strictEqual(result.repairMessage, undefined);
  });

  test("should skip when repair limit exceeded", async () => {
    const assistantText = `
\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\`
`;
    const repaired = new Set<string>();
    // Pre-populate repaired set beyond limit
    for (let i = 0; i <= 3; i++) {
      repaired.add(`diagram${i}`);
    }
    
    const result = await validateAndRepairMermaidDiagrams(assistantText, repaired, 3, mockParsers);
    
    assert.strictEqual(result.needsRepair, false);
  });

  test("should track repaired diagrams", async () => {
    const diagram = `graph TD
    A[Start] --> B[End]`;
    
    const assistantText = `\`\`\`mermaid\n${diagram}\n\`\`\``;
    const repaired = new Set<string>();
    
    // First call should process the diagram
    await validateAndRepairMermaidDiagrams(assistantText, repaired, 3, mockParsers);
    
    // Diagram should be added to repaired set
    assert.ok(repaired.has(diagram));
    
    // Second call with same diagram should skip it
    const result2 = await validateAndRepairMermaidDiagrams(assistantText, repaired, 3, mockParsers);
    assert.strictEqual(result2.needsRepair, false);
  });
});