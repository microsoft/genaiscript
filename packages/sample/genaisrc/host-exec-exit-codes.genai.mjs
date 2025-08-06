script({
    model: "small",
    tests: {
        keywords: ["exit", "code", "preserved"],
    },
})

// Test script to demonstrate host.exec exit code preservation
console.log("Testing host.exec exit code preservation...")

// Test command that exits with code 0 (success)
console.log("\n1. Testing successful command (exit code 0):")
const result0 = await host.exec("", "echo", ["hello world"])
console.log(`   Exit code: ${result0.exitCode}`)
console.log(`   Failed: ${result0.failed}`)
console.log(`   Output: ${result0.stdout}`)

// Test command that exits with code 1
console.log("\n2. Testing command with exit code 1:")
const result1 = await host.exec("", "false", [])
console.log(`   Exit code: ${result1.exitCode}`)
console.log(`   Failed: ${result1.failed}`)

// Test command that exits with code 2
console.log("\n3. Testing command with exit code 2:")
const result2 = await host.exec("", "sh", ["-c", "exit 2"])
console.log(`   Exit code: ${result2.exitCode}`)
console.log(`   Failed: ${result2.failed}`)

// Test command that exits with code 3
console.log("\n4. Testing command with exit code 3:")
const result3 = await host.exec("", "sh", ["-c", "exit 3"])
console.log(`   Exit code: ${result3.exitCode}`)
console.log(`   Failed: ${result3.failed}`)

def("EXIT_CODE_RESULTS", {
    "echo_hello": { exitCode: result0.exitCode, failed: result0.failed },
    "false_command": { exitCode: result1.exitCode, failed: result1.failed },
    "exit_code_2": { exitCode: result2.exitCode, failed: result2.failed },
    "exit_code_3": { exitCode: result3.exitCode, failed: result3.failed }
})

$`
Analyze these test results and confirm that:
1. The echo command succeeds with exit code 0
2. The false command fails with exit code 1 
3. The "exit 2" command fails with exit code 2
4. The "exit 3" command fails with exit code 3

This demonstrates that host.exec correctly preserves the original exit codes from subprocesses instead of hardcoding exitCode: 1 for all failures.
`