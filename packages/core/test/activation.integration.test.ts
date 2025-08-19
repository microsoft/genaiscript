// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Integration test to demonstrate the activation field functionality.
 * This test validates that system prompts are correctly activated based on their activation keywords.
 */

import { describe, test, assert } from "vitest";
import { resolveSystems } from "../src/systems.js";
import type { Project } from "../src/server/messages.js";
import type { PromptScript } from "../src/types.js";

describe("activation field integration", () => {
  test("should demonstrate activation field working with realistic example", () => {
    // Create a realistic scenario with multiple system prompts
    const projectScripts: PromptScript[] = [
      // System prompts with activation keywords
      {
        id: "system.files",
        title: "File generation system",
        isSystem: true,
        activation: ["file", "files", "filesystem"],
      } as PromptScript,
      {
        id: "system.git_info",
        title: "Git information system",
        isSystem: true,
        activation: ["git", "repository", "commit"],
      } as PromptScript,
      {
        id: "system.annotations",
        title: "Code annotations system",
        isSystem: true,
        activation: ["error", "warning", "annotation"],
      } as PromptScript,
      // System prompt without activation (shouldn't be auto-activated)
      {
        id: "system.manual_only",
        title: "Manual activation only",
        isSystem: true,
        // No activation field
      } as PromptScript,
      // Regular prompt (not a system prompt)
      {
        id: "regular.prompt",
        title: "Regular prompt",
        isSystem: false,
        activation: ["should", "not", "matter"],
      } as PromptScript,
    ];

    const project: Project = {
      scripts: projectScripts,
      diagnostics: [],
    };

    // Test scenario: User writes a script that references files and git
    const userScript = {
      jsSource: `
        // Read configuration file
        const config = file.readText("config.json");
        
        // Get current git branch
        const branch = git.branch();
        
        console.log("Processing files on branch:", branch);
      `,
    };

    const resolvedSystems = resolveSystems(project, userScript);
    const systemIds = resolvedSystems.map(s => s.id);

    // Should activate system.files because "file" appears in jsSource
    assert.include(systemIds, "system.files", "Should activate system.files due to 'file' keyword");
    
    // Should activate system.git_info because "git" appears in jsSource  
    assert.include(systemIds, "system.git_info", "Should activate system.git_info due to 'git' keyword");
    
    // Should NOT activate system.annotations because no relevant keywords appear
    assert.notInclude(systemIds, "system.annotations", "Should not activate system.annotations - no relevant keywords");
    
    // Should NOT activate system.manual_only because it has no activation keywords
    assert.notInclude(systemIds, "system.manual_only", "Should not activate system.manual_only - no activation keywords");
    
    // Should NOT include regular prompts
    assert.notInclude(systemIds, "regular.prompt", "Should not include non-system prompts");
  });

  test("should preserve explicit system configuration when provided", () => {
    const projectScripts: PromptScript[] = [
      {
        id: "system.files",
        title: "File generation system",
        isSystem: true,
        activation: ["file", "files"],
      } as PromptScript,
      {
        id: "system.custom",
        title: "Custom system prompt",
        isSystem: true,
        // No activation keywords
      } as PromptScript,
    ];

    const project: Project = {
      scripts: projectScripts,
      diagnostics: [],
    };

    // When user explicitly specifies system prompts, activation should be bypassed
    const userScriptWithExplicitSystem = {
      jsSource: "const data = file.readText('data.txt');", // Contains "file" keyword
      system: ["system.custom"], // Explicitly specified
    };

    const resolvedSystems = resolveSystems(project, userScriptWithExplicitSystem);
    const systemIds = resolvedSystems.map(s => s.id);

    // Should include explicitly specified system
    assert.include(systemIds, "system.custom", "Should include explicitly specified system");
    
    // Should NOT include auto-activated systems when explicit system is provided
    assert.notInclude(systemIds, "system.files", "Should not auto-activate when explicit system is provided");
  });

  test("should handle multiple activation keywords for same system", () => {
    const projectScripts: PromptScript[] = [
      {
        id: "system.development",
        title: "Development tools system",
        isSystem: true,
        activation: ["code", "debug", "test", "build", "compile"],
      } as PromptScript,
    ];

    const project: Project = {
      scripts: projectScripts,
      diagnostics: [],
    };

    // Test different keywords that should all activate the same system
    const testCases = [
      "Write some code for the project",
      "Debug the application",
      "Run the test suite", 
      "Build the application",
      "Compile the source files",
    ];

    for (const jsSource of testCases) {
      const script = { jsSource };
      const resolvedSystems = resolveSystems(project, script);
      const systemIds = resolvedSystems.map(s => s.id);
      
      assert.include(systemIds, "system.development", 
        `Should activate system.development for: "${jsSource}"`);
    }
  });
});