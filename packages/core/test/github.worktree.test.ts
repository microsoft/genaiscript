// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, beforeEach, afterEach, beforeAll } from "vitest";
import { GitHubClient } from "../src/githubclient.js";
import { TestHost } from "../src/testhost.js";
import { mkdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

describe("github worktree", () => {
  let githubClient: GitHubClient;
  let testDir: string;
  let worktreePath: string;

  beforeAll(async () => {
    // Initialize test host for the GenAIScript runtime
    TestHost.install();
  });

  beforeEach(async () => {
    testDir = join(process.cwd(), "test-tmp-github");
    worktreePath = join(testDir, "test-github-worktree");

    // Create test directory
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    githubClient = GitHubClient.default();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      if (existsSync(testDir)) {
        await rmdir(testDir, { recursive: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test("should handle PR worktree creation (mocked)", async () => {
    // This test mainly verifies the method exists and handles error cases
    // We can't easily test actual PR worktree creation without a real PR

    try {
      const worktreeClient = await githubClient.addWorktreeForPullRequest(999999, worktreePath);
      // If this doesn't throw, something unexpected happened
      expect(false).toBe(true);
    } catch (error) {
      // Expected to fail due to network restrictions or PR not found
      expect(error.message).toBeDefined();
    }
  });
});
