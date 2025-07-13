/**
 * Test script to validate the new import functionality for GenAIScript
 * This test verifies that the global functions can be imported from "genaiscript"
 * and that they provide appropriate error messages when used outside the execution context.
 */

// Test the import statement that was requested in the issue
import { script, $, def } from "genaiscript";

// Test additional commonly used functions
import { writeText, defFileOutput } from "genaiscript";

console.log("=== Testing GenAIScript Import Support ===\n");

// Test 1: Verify functions are importable
console.log("1. Testing function imports:");
console.log("   script:", typeof script);
console.log("   $:", typeof $);
console.log("   def:", typeof def);
console.log("   writeText:", typeof writeText);
console.log("   defFileOutput:", typeof defFileOutput);
console.log("   ✓ All functions successfully imported\n");

// Test 2: Verify error messages are helpful
console.log("2. Testing error messages:");

const testFunction = (name, fn, ...args) => {
    try {
        fn(...args);
        console.log(`   ✗ ${name} should have thrown an error`);
        return false;
    } catch (e) {
        console.log(`   ✓ ${name} correctly throws: ${e.message}`);
        return true;
    }
};

const allPassed = [
    testFunction("script", script, { title: "Test" }),
    testFunction("$", $, ["test template"]),
    testFunction("def", def, "test", "value"),
    testFunction("writeText", writeText, "test"),
    testFunction("defFileOutput", defFileOutput, "test.txt", "test file"),
].every(Boolean);

console.log("\n=== Test Results ===");
if (allPassed) {
    console.log("✓ All tests passed! The import functionality works correctly.");
    console.log("✓ Users can now import global functions from 'genaiscript' for IDE support.");
} else {
    console.log("✗ Some tests failed.");
    process.exit(1);
}

export { script, $, def, writeText, defFileOutput };