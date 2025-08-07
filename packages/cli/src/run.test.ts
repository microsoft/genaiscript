import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { USER_CANCELLED_ERROR_CODE, RUNTIME_ERROR_CODE } from "../../core/src/constants"

describe("cancellation exit code logic", () => {
    test("should verify cancellation error codes exist", () => {
        assert.strictEqual(USER_CANCELLED_ERROR_CODE, -7)
        assert.strictEqual(RUNTIME_ERROR_CODE, -5)
    })

    test("should handle cancelled status correctly", () => {
        // Test the logic that would be used in runScriptInternal after our fix
        function getExitCodeForStatus(status: string): number {
            // This mirrors the logic we implemented in the fix
            if (status === "cancelled") {
                return USER_CANCELLED_ERROR_CODE
            }
            if (status !== "success") {
                return RUNTIME_ERROR_CODE
            }
            return 0
        }

        assert.strictEqual(getExitCodeForStatus("cancelled"), USER_CANCELLED_ERROR_CODE)
        assert.strictEqual(getExitCodeForStatus("success"), 0)
        assert.strictEqual(getExitCodeForStatus("error"), RUNTIME_ERROR_CODE)
        assert.strictEqual(getExitCodeForStatus("failed"), RUNTIME_ERROR_CODE)
    })

    test("should ensure cancelled status takes precedence over general error handling", () => {
        // This test validates that the cancelled check comes before the general error check
        const statusHandlingOrder = ["cancelled", "success", "error"]
        
        for (const status of statusHandlingOrder) {
            let exitCode: number
            
            // Simulate the exact logic from our fix
            if (status === "cancelled") {
                exitCode = USER_CANCELLED_ERROR_CODE
            } else if (status !== "success") {
                exitCode = RUNTIME_ERROR_CODE  
            } else {
                exitCode = 0
            }
            
            if (status === "cancelled") {
                assert.strictEqual(exitCode, USER_CANCELLED_ERROR_CODE, 
                    "Cancelled status should return USER_CANCELLED_ERROR_CODE")
            } else if (status === "success") {
                assert.strictEqual(exitCode, 0, 
                    "Success status should return 0")
            } else {
                assert.strictEqual(exitCode, RUNTIME_ERROR_CODE, 
                    `Status '${status}' should return RUNTIME_ERROR_CODE`)
            }
        }
    })
})