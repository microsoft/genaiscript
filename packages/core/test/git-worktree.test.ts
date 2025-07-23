// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach, afterEach } from "vitest";
import { GitClient } from "../src/git.js";
import { TestHost } from "../src/testhost.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Git Worktree", () => {
  let tempDir: string;
  let gitClient: GitClient;

  beforeEach(async () => {
    TestHost.install();
    tempDir = await mkdtemp(join(tmpdir(), "git-worktree-test-"));
    gitClient = new GitClient(tempDir);
    
    // Initialize a git repository for testing
    await gitClient.exec(["init"]);
    await gitClient.exec(["config", "user.name", "Test User"]);
    await gitClient.exec(["config", "user.email", "test@example.com"]);
    
    // Create an initial commit
    await gitClient.exec(["commit", "--allow-empty", "-m", "Initial commit"]);
  });

  test("listWorktrees() returns main worktree", async () => {
    const worktrees = await gitClient.listWorktrees();
    assert(worktrees.length >= 1);
    assert(worktrees[0].path);
    assert(worktrees[0].sha);
  });

  test("addWorktree() creates new worktree", async () => {
    const worktreePath = join(tempDir, "new-worktree");
    
    // Create a new branch first
    await gitClient.exec(["checkout", "-b", "feature-branch"]);
    await gitClient.exec(["checkout", "main"]);
    
    const worktree = await gitClient.addWorktree(worktreePath, "feature-branch");
    
    assert.strictEqual(worktree.path, worktreePath);
    assert.strictEqual(worktree.branch, "refs/heads/feature-branch");
    assert(worktree.sha);
    
    const worktrees = await gitClient.listWorktrees();
    assert(worktrees.length >= 2);
    assert(worktrees.some(w => w.path === worktreePath));
  });

  test("removeWorktree() removes worktree", async () => {
    const worktreePath = join(tempDir, "temp-worktree");
    
    // Create a new branch and worktree
    await gitClient.exec(["checkout", "-b", "temp-branch"]);
    await gitClient.exec(["checkout", "main"]);
    
    await gitClient.addWorktree(worktreePath, "temp-branch");
    
    // Verify worktree exists
    let worktrees = await gitClient.listWorktrees();
    assert(worktrees.some(w => w.path === worktreePath));
    
    // Remove worktree
    await gitClient.removeWorktree(worktreePath);
    
    // Verify worktree is removed
    worktrees = await gitClient.listWorktrees();
    assert(!worktrees.some(w => w.path === worktreePath));
  });

  test("lockWorktree() and unlockWorktree() work correctly", async () => {
    const worktreePath = join(tempDir, "lockable-worktree");
    
    // Create a new branch and worktree
    await gitClient.exec(["checkout", "-b", "lockable-branch"]);
    await gitClient.exec(["checkout", "main"]);
    
    await gitClient.addWorktree(worktreePath, "lockable-branch");
    
    // Lock the worktree
    await gitClient.lockWorktree(worktreePath, "Testing lock functionality");
    
    // Verify worktree is locked
    let worktrees = await gitClient.listWorktrees();
    const lockedWorktree = worktrees.find(w => w.path === worktreePath);
    assert(lockedWorktree?.locked);
    assert.strictEqual(lockedWorktree?.lockReason, "Testing lock functionality");
    
    // Unlock the worktree
    await gitClient.unlockWorktree(worktreePath);
    
    // Verify worktree is unlocked
    worktrees = await gitClient.listWorktrees();
    const unlockedWorktree = worktrees.find(w => w.path === worktreePath);
    assert(!unlockedWorktree?.locked);
  });

  test("pruneWorktrees() returns pruned worktrees", async () => {
    // This is mainly to test the interface - actual pruning would require
    // worktrees that are no longer valid
    const result = await gitClient.pruneWorktrees({ dryRun: true });
    assert(Array.isArray(result));
  });

  // Clean up after tests
  afterEach(async () => {
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
});