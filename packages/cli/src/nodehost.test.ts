// Test for host.exec exit code preservation
import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { NodeHost } from "./nodehost.js"

describe("host.exec exit code preservation", () => {
    test("should preserve exit codes", async () => {
        const host = new NodeHost()
        
        // Test command that exits with code 1
        const result1 = await host.exec("", "false", [], {})
        assert.strictEqual(result1.exitCode, 1, "false command should exit with code 1")
        assert.strictEqual(result1.failed, true, "false command should be marked as failed")
        
        // Test command that exits with code 2 (grep with invalid regex)
        // Note: We use a command that consistently exits with code 2 across platforms
        const result2 = await host.exec("", "sh", ["-c", "exit 2"], {})
        assert.strictEqual(result2.exitCode, 2, "sh -c 'exit 2' should exit with code 2")
        assert.strictEqual(result2.failed, true, "sh -c 'exit 2' should be marked as failed")
        
        // Test successful command for comparison
        const result3 = await host.exec("", "echo", ["hello"], {})
        assert.strictEqual(result3.exitCode, 0, "echo command should exit with code 0")
        assert.strictEqual(result3.failed, false, "echo command should not be marked as failed")
        assert.ok(result3.stdout.includes("hello"), "echo command should output 'hello'")
    })
})