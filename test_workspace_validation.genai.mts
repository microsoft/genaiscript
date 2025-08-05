script({
    title: "Test workspace validation",
    description: "Test workspace writeText directly",
})

try {
    // Test writing within workspace
    await workspace.writeText("test_workspace.txt", "This should work")
    console.log("✓ Writing within workspace works")
} catch (e) {
    console.log("✗ Writing within workspace failed:", e.message)
}

try {
    // Test writing outside workspace
    await workspace.writeText("../outside.txt", "This should fail")
    console.log("✗ Writing outside workspace should have failed!")
} catch (e) {
    console.log("✓ Writing outside workspace correctly blocked:", e.message)
}

try {
    // Test writing .env file
    await workspace.writeText(".env", "SECRET=value")
    console.log("✗ Writing .env should have failed!")
} catch (e) {
    console.log("✓ Writing .env correctly blocked:", e.message)
}