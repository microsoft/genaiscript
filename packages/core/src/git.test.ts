import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { GitClient } from "./git"

describe("git worktree", () => {
    describe("worktreeList parsing", () => {
        test("parses empty output", async () => {
            const client = new GitClient(".")
            // Mock exec to return empty output
            const originalExec = client.exec
            client.exec = async () => ""
            
            const result = await client.worktreeList()
            assert.equal(result.length, 0)
            
            // Restore original exec
            client.exec = originalExec
        })
        
        test("parses single worktree", async () => {
            const client = new GitClient(".")
            const mockOutput = `worktree /home/user/main
HEAD 1234567890abcdef1234567890abcdef12345678
branch refs/heads/main

`
            
            // Mock exec to return test output
            const originalExec = client.exec
            client.exec = async () => mockOutput
            
            const result = await client.worktreeList()
            assert.equal(result.length, 1)
            assert.equal(result[0].path, "/home/user/main")
            assert.equal(result[0].head, "1234567890abcdef1234567890abcdef12345678")
            assert.equal(result[0].branch, "refs/heads/main")
            assert.equal(result[0].bare, undefined)
            assert.equal(result[0].detached, undefined)
            
            // Restore original exec
            client.exec = originalExec
        })
        
        test("parses multiple worktrees with different states", async () => {
            const client = new GitClient(".")
            const mockOutput = `worktree /home/user/main
HEAD 1234567890abcdef1234567890abcdef12345678
branch refs/heads/main

worktree /home/user/feature
HEAD abcdef1234567890abcdef1234567890abcdef12
branch refs/heads/feature

worktree /home/user/detached
HEAD fedcba0987654321fedcba0987654321fedcba09
detached

worktree /home/user/bare
HEAD 1111111111111111111111111111111111111111
bare

`
            
            // Mock exec to return test output
            const originalExec = client.exec
            client.exec = async () => mockOutput
            
            const result = await client.worktreeList()
            assert.equal(result.length, 4)
            
            // Check main worktree
            assert.equal(result[0].path, "/home/user/main")
            assert.equal(result[0].branch, "refs/heads/main")
            assert.equal(result[0].bare, undefined)
            assert.equal(result[0].detached, undefined)
            
            // Check feature worktree
            assert.equal(result[1].path, "/home/user/feature")
            assert.equal(result[1].branch, "refs/heads/feature")
            
            // Check detached worktree
            assert.equal(result[2].path, "/home/user/detached")
            assert.equal(result[2].detached, true)
            assert.equal(result[2].branch, undefined)
            
            // Check bare worktree
            assert.equal(result[3].path, "/home/user/bare")
            assert.equal(result[3].bare, true)
            assert.equal(result[3].branch, undefined)
            
            // Restore original exec
            client.exec = originalExec
        })
    })
    
    describe("worktree commands", () => {
        test("worktreeAdd builds correct command", async () => {
            const client = new GitClient(".")
            let capturedArgs: string[] = []
            
            // Mock exec to capture arguments
            const originalExec = client.exec
            client.exec = async (args: string[]) => {
                capturedArgs = args
                return "Mock response"
            }
            
            await client.worktreeAdd("/path/to/worktree")
            assert.deepEqual(capturedArgs, ["worktree", "add", "/path/to/worktree"])
            
            await client.worktreeAdd("/path/to/worktree", "feature-branch")
            assert.deepEqual(capturedArgs, ["worktree", "add", "/path/to/worktree", "feature-branch"])
            
            // Restore original exec
            client.exec = originalExec
        })
        
        test("worktreeRemove builds correct command", async () => {
            const client = new GitClient(".")
            let capturedArgs: string[] = []
            
            // Mock exec to capture arguments
            const originalExec = client.exec
            client.exec = async (args: string[]) => {
                capturedArgs = args
                return "Mock response"
            }
            
            await client.worktreeRemove("/path/to/worktree")
            assert.deepEqual(capturedArgs, ["worktree", "remove", "/path/to/worktree"])
            
            await client.worktreeRemove("/path/to/worktree", true)
            assert.deepEqual(capturedArgs, ["worktree", "remove", "--force", "/path/to/worktree"])
            
            // Restore original exec
            client.exec = originalExec
        })
        
        test("worktreePrune builds correct command", async () => {
            const client = new GitClient(".")
            let capturedArgs: string[] = []
            
            // Mock exec to capture arguments
            const originalExec = client.exec
            client.exec = async (args: string[]) => {
                capturedArgs = args
                return "Mock response"
            }
            
            await client.worktreePrune()
            assert.deepEqual(capturedArgs, ["worktree", "prune"])
            
            // Restore original exec
            client.exec = originalExec
        })
    })
})