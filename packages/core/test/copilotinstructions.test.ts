import { describe, test, expect } from "vitest"
import { importCopilotInstructions, formatCopilotInstructions } from "../../runtime/src/copilotinstructions.js"
import type { WorkspaceFileSystem, WorkspaceFile } from "../src/types.js"

// Mock workspace filesystem for testing
class MockWorkspaceFileSystem implements Partial<WorkspaceFileSystem> {
  private files: WorkspaceFile[] = []

  addFile(filename: string, content: string): void {
    this.files.push({ filename, content })
  }

  async findFiles(patterns: string | string[]): Promise<WorkspaceFile[]> {
    const searchPatterns = Array.isArray(patterns) ? patterns : [patterns]
    return this.files.filter(file =>
      searchPatterns.some(pattern => {
        // Simple glob pattern matching for tests
        const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
        return new RegExp(`^${regex}$`).test(file.filename)
      })
    )
  }

  // Required methods (stubs for testing)
  async grep(): Promise<any> { return { files: [] } }
  async readText(): Promise<string> { return "" }
  async readJSON(): Promise<any> { return {} }
  async readYAML(): Promise<any> { return {} }
  async readXML(): Promise<any> { return {} }
  async readCSV(): Promise<any> { return [] }
  async readData(): Promise<any> { return null }
  async writeText(): Promise<void> {}
  async appendText(): Promise<void> {}
  async stat(): Promise<any> { return {} }
}

describe("copilotinstructions", () => {
  test("imports instructions with matching patterns", async () => {
    const workspace = new MockWorkspaceFileSystem()
    
    workspace.addFile(".github/instructions/typescript.instructions.md", `---
applyTo: "**/*.ts"
description: "TypeScript guidelines"
---
# TypeScript Instructions
Use strict types.`)

    const instructions = await importCopilotInstructions(
      workspace as any,
      ["src/app.ts", "test.js"]
    )

    expect(instructions).toHaveLength(1)
    expect(instructions[0].filename).toBe(".github/instructions/typescript.instructions.md")
    expect(instructions[0].metadata?.applyTo).toBe("**/*.ts")
    expect(instructions[0].content).toContain("TypeScript Instructions")
  })

  test("imports general instructions when includeGeneral is true", async () => {
    const workspace = new MockWorkspaceFileSystem()
    
    workspace.addFile(".github/copilot-instructions.md", `# General Guidelines
Write clean code.`)

    const instructions = await importCopilotInstructions(
      workspace as any,
      ["src/app.ts"],
      { includeGeneral: true }
    )

    expect(instructions).toHaveLength(1)
    expect(instructions[0].filename).toBe(".github/copilot-instructions.md")
    expect(instructions[0].metadata).toBeUndefined()
  })

  test("formats instructions correctly", () => {
    const instructions = [
      {
        filename: ".github/instructions/test1.md",
        content: "First instruction",
        metadata: {}
      },
      {
        filename: ".github/instructions/test2.md",
        content: "Second instruction",
        metadata: {}
      }
    ]

    const formatted = formatCopilotInstructions(instructions)
    expect(formatted).toBe("First instruction\n\nSecond instruction")
  })

  test("includes source info when requested", () => {
    const instructions = [
      {
        filename: ".github/instructions/test.md",
        content: "Test instruction",
        metadata: {}
      }
    ]

    const formatted = formatCopilotInstructions(instructions, {
      includeSourceInfo: true
    })
    
    expect(formatted).toContain("<!-- Source: .github/instructions/test.md -->")
    expect(formatted).toContain("Test instruction")
  })
})