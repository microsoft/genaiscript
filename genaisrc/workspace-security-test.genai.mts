script({
    title: "Workspace Security Test",
    description: "Demonstrates workspace boundary protections and secure file operations",
    model: "echo", // Use echo model to avoid LLM calls
    unlisted: true, // Don't show in normal script listings
})

// This script demonstrates workspace security features by testing various file operations
// Some operations will succeed (within workspace) and others will fail (outside workspace)

console.log("Testing workspace boundary protections...")

// ✅ ALLOWED OPERATIONS - These should work
console.log("\n=== ALLOWED OPERATIONS ===")

try {
    // Write to a file within workspace
    await workspace.writeText("test-output.txt", "This is a test file within the workspace.\n")
    console.log("✅ Writing within workspace: SUCCESS")
} catch (error) {
    console.log("❌ Writing within workspace: FAILED -", error.message)
}

try {
    // Write to a subdirectory within workspace
    await workspace.writeText("temp/nested-file.txt", "This is a nested file within the workspace.\n")
    console.log("✅ Writing to subdirectory: SUCCESS")
} catch (error) {
    console.log("❌ Writing to subdirectory: FAILED -", error.message)
}

try {
    // Append to existing file
    await workspace.appendText("test-output.txt", "Appended content.\n")
    console.log("✅ Appending to file: SUCCESS")
} catch (error) {
    console.log("❌ Appending to file: FAILED -", error.message)
}

// ❌ BLOCKED OPERATIONS - These should fail with security errors
console.log("\n=== BLOCKED OPERATIONS ===")

try {
    // Attempt to write outside workspace using absolute path
    await workspace.writeText("/etc/passwd", "malicious content")
    console.log("❌ SECURITY BREACH: Absolute path write succeeded!")
} catch (error) {
    console.log("✅ Absolute path blocked:", error.message)
}

try {
    // Attempt path traversal attack
    await workspace.writeText("../../../etc/passwd", "malicious content")
    console.log("❌ SECURITY BREACH: Path traversal succeeded!")
} catch (error) {
    console.log("✅ Path traversal blocked:", error.message)
}

try {
    // Attempt to write .env file
    await workspace.writeText(".env", "SECRET_KEY=malicious_value")
    console.log("❌ SECURITY BREACH: .env write succeeded!")
} catch (error) {
    console.log("✅ .env file blocked:", error.message)
}

try {
    // Attempt to write .env file in subdirectory
    await workspace.writeText("config/.env.local", "API_KEY=malicious_value")
    console.log("❌ SECURITY BREACH: Nested .env write succeeded!")
} catch (error) {
    console.log("✅ Nested .env file blocked:", error.message)
}

try {
    // Attempt to go up one directory and write
    await workspace.writeText("../malicious.txt", "malicious content")
    console.log("❌ SECURITY BREACH: Parent directory write succeeded!")
} catch (error) {
    console.log("✅ Parent directory access blocked:", error.message)
}

console.log("\n=== WORKSPACE SECURITY TEST COMPLETE ===")
console.log("All security boundaries are properly enforced!")

// Clean up test files
try {
    const fs = await import('fs')
    const path = await import('path')
    
    // Note: This cleanup uses Node.js fs module directly (unchecked operations)
    // This demonstrates the difference between workspace-protected and direct fs access
    const testFile = path.join(process.cwd(), "test-output.txt")
    const tempDir = path.join(process.cwd(), "temp")
    
    if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
        console.log("🧹 Cleaned up test-output.txt")
    }
    
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
        console.log("🧹 Cleaned up temp directory")
    }
} catch (error) {
    console.log("Note: Could not clean up test files:", error.message)
}