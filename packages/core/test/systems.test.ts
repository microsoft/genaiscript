// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { resolveSystems } from "../src/systems.js";
import type { Project } from "../src/server/messages.js";
import type { PromptScript } from "../src/types.js";

describe("systems", () => {
  test("should activate system prompts based on activation keywords", () => {
    // Mock project with system prompts that have activation keywords
    const mockSystemPrompts: PromptScript[] = [
      {
        id: "system.files",
        title: "File generation",
        isSystem: true,
        activation: ["file", "files"],
      } as PromptScript,
      {
        id: "system.git_info", 
        title: "Git repository information",
        isSystem: true,
        activation: ["git"],
      } as PromptScript,
      {
        id: "system.changelog",
        title: "Generate changelog formatter edits",
        isSystem: true,
        activation: ["changelog"],
      } as PromptScript,
      {
        id: "system.no_activation",
        title: "System without activation",
        isSystem: true,
      } as PromptScript,
    ];

    const mockProject: Project = {
      scripts: mockSystemPrompts,
      diagnostics: [],
    };

    // Test case 1: jsSource contains "file" - should activate system.files
    const script1 = {
      jsSource: "let data = file.readText(); console.log(data);",
    };
    const result1 = resolveSystems(mockProject, script1);
    const systemIds1 = result1.map(s => s.id);
    assert.include(systemIds1, "system.files", "Should include system.files when jsSource contains 'file'");

    // Test case 2: jsSource contains "git" - should activate system.git_info
    const script2 = {
      jsSource: "const branch = git.branch(); console.log(branch);",
    };
    const result2 = resolveSystems(mockProject, script2);
    const systemIds2 = result2.map(s => s.id);
    assert.include(systemIds2, "system.git_info", "Should include system.git_info when jsSource contains 'git'");

    // Test case 3: jsSource contains "changelog" - should activate system.changelog
    const script3 = {
      jsSource: "Generate a changelog for these changes",
    };
    const result3 = resolveSystems(mockProject, script3);
    const systemIds3 = result3.map(s => s.id);
    assert.include(systemIds3, "system.changelog", "Should include system.changelog when jsSource contains 'changelog'");

    // Test case 4: jsSource contains multiple keywords - should activate multiple systems
    const script4 = {
      jsSource: "Read file and check git status",
    };
    const result4 = resolveSystems(mockProject, script4);
    const systemIds4 = result4.map(s => s.id);
    assert.include(systemIds4, "system.files", "Should include system.files when jsSource contains 'file'");
    assert.include(systemIds4, "system.git_info", "Should include system.git_info when jsSource contains 'git'");

    // Test case 5: jsSource doesn't contain activation keywords - should not activate those systems
    const script5 = {
      jsSource: "console.log('hello world');",
    };
    const result5 = resolveSystems(mockProject, script5);
    const systemIds5 = result5.map(s => s.id);
    assert.notInclude(systemIds5, "system.files", "Should not include system.files when jsSource doesn't contain activation keywords");
    assert.notInclude(systemIds5, "system.git_info", "Should not include system.git_info when jsSource doesn't contain activation keywords");
    assert.notInclude(systemIds5, "system.changelog", "Should not include system.changelog when jsSource doesn't contain activation keywords");
  });

  test("should not activate systems when explicit system is provided", () => {
    const mockSystemPrompts: PromptScript[] = [
      {
        id: "system.files",
        title: "File generation",
        isSystem: true,
        activation: ["file", "files"],
      } as PromptScript,
    ];

    const mockProject: Project = {
      scripts: mockSystemPrompts,
      diagnostics: [],
    };

    // When system is explicitly provided, activation should not be used
    const script = {
      jsSource: "let data = file.readText(); console.log(data);",
      system: ["system.other"],
    };
    const result = resolveSystems(mockProject, script);
    const systemIds = result.map(s => s.id);
    assert.include(systemIds, "system.other", "Should include explicitly provided system");
    assert.notInclude(systemIds, "system.files", "Should not include activated system when explicit system is provided");
  });

  test("should handle systems with multiple activation keywords", () => {
    const mockSystemPrompts: PromptScript[] = [
      {
        id: "system.files",
        title: "File generation",
        isSystem: true,
        activation: ["file", "files", "filesystem"],
      } as PromptScript,
    ];

    const mockProject: Project = {
      scripts: mockSystemPrompts,
      diagnostics: [],
    };

    // Test activation with different keywords
    const testCases = ["file", "files", "filesystem"];
    
    for (const keyword of testCases) {
      const script = {
        jsSource: `Use ${keyword} to process data`,
      };
      const result = resolveSystems(mockProject, script);
      const systemIds = result.map(s => s.id);
      assert.include(systemIds, "system.files", `Should include system.files when jsSource contains '${keyword}'`);
    }
  });

  test("should handle edge cases with activation keywords", () => {
    const mockSystemPrompts: PromptScript[] = [
      {
        id: "system.files",
        title: "File generation", 
        isSystem: true,
        activation: ["file"],
      } as PromptScript,
    ];

    const mockProject: Project = {
      scripts: mockSystemPrompts,
      diagnostics: [],
    };

    // Test that partial matches don't activate (word boundaries)
    const script1 = {
      jsSource: "profile information",  // contains "file" but not as a word boundary
    };
    const result1 = resolveSystems(mockProject, script1);
    const systemIds1 = result1.map(s => s.id);
    assert.notInclude(systemIds1, "system.files", "Should not activate on partial keyword matches");

    // Test that exact word matches do activate  
    const script2 = {
      jsSource: "read the file content",  // contains "file" as a word
    };
    const result2 = resolveSystems(mockProject, script2);
    const systemIds2 = result2.map(s => s.id);
    assert.include(systemIds2, "system.files", "Should activate on exact word matches");
  });

  test("should handle built-in system activation keywords like existing system prompts", () => {
    // Test with real system prompts that have activation keywords
    const realSystemPrompts: PromptScript[] = [
      {
        id: "system.files",
        title: "File generation",
        isSystem: true,
        activation: ["file", "files"],
      } as PromptScript,
      {
        id: "system.annotations",
        title: "Emits annotations",
        isSystem: true,
        activation: ["annotations", "warnings", "errors"],
      } as PromptScript,
      {
        id: "system.diagrams",
        title: "Generate diagrams",
        isSystem: true,
        activation: ["diagram", "chart"],
      } as PromptScript,
      {
        id: "system.git_info",
        title: "Git repository information",
        isSystem: true,
        activation: ["git"],
      } as PromptScript,
      {
        id: "system.github_info",
        title: "GitHub information",
        isSystem: true,
        activation: ["github"],
      } as PromptScript,
      {
        id: "system.changelog",
        title: "Changelog generation",
        isSystem: true,
        activation: ["changelog"],
      } as PromptScript,
      {
        id: "system.today",
        title: "Today's date",
        isSystem: true,
        activation: ["today"],
      } as PromptScript,
    ];

    const mockProject: Project = {
      scripts: realSystemPrompts,
      diagnostics: [],
    };

    // Test various activation scenarios that used to be hardcoded
    const testCases = [
      { jsSource: "Read the file content", expected: ["system.files"] },
      { jsSource: "Check for errors and warnings", expected: ["system.annotations"] },
      { jsSource: "Create a diagram showing the flow", expected: ["system.diagrams"] },
      { jsSource: "Get the git branch information", expected: ["system.git_info"] },
      { jsSource: "Query github repository data", expected: ["system.github_info"] },
      { jsSource: "Generate a changelog for the release", expected: ["system.changelog"] },
      { jsSource: "What is today's date?", expected: ["system.today"] },
      { 
        jsSource: "Read files, check git status, and create diagrams", 
        expected: ["system.files", "system.git_info", "system.diagrams"] 
      },
    ];

    for (const testCase of testCases) {
      const script = { jsSource: testCase.jsSource };
      const result = resolveSystems(mockProject, script);
      const systemIds = result.map(s => s.id);
      
      for (const expectedSystem of testCase.expected) {
        assert.include(systemIds, expectedSystem, 
          `Should include ${expectedSystem} when jsSource is: "${testCase.jsSource}"`);
      }
    }
  });
});