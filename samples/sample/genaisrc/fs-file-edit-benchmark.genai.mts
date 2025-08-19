script({
    title: "File Edit Benchmarks",
    description: "Comprehensive benchmarks for the fs_file_edit tool testing various file splice operations",
    group: "File System Tests",
    temperature: 0,
    tools: ["fs_file_edit"],
    tests: [
        {
            files: [],
            asserts: [
                {
                    type: "icontains", 
                    value: "All file edit benchmarks completed",
                },
            ],
        },
    ],
})

// Create benchmark test files and run comprehensive file edit tests
const testResults: string[] = []

async function createTestFile(filename: string, content: string): Promise<void> {
    await workspace.writeText(filename, content)
}

async function readTestFile(filename: string): Promise<string> {
    const result = await workspace.readText(filename)
    return result.content || ""
}

async function runBenchmark(name: string, test: () => Promise<boolean>): Promise<void> {
    const startTime = Date.now()
    try {
        const success = await test()
        const duration = Date.now() - startTime
        const status = success ? "✅ PASS" : "❌ FAIL"
        testResults.push(`${status} ${name} (${duration}ms)`)
    } catch (error) {
        const duration = Date.now() - startTime
        testResults.push(`❌ ERROR ${name} (${duration}ms): ${error}`)
    }
}

// Test data
const sampleContent = `Line 1: Beginning
Line 2: Middle content
Line 3: Another middle line
Line 4: More content here
Line 5: End of file`

const largeContent = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}: Large file content line`).join('\n')

// Setup test files
await createTestFile("benchmark-sample.txt", sampleContent)
await createTestFile("benchmark-large.txt", largeContent)
await createTestFile("benchmark-empty.txt", "")

console.log("🚀 File Edit Benchmark Test Setup Complete")
console.log(`Created test files with sample content for fs_file_edit tool testing`)

$`You are an expert software tester evaluating the fs_file_edit tool through comprehensive benchmarks.

## Your Task
Use the fs_file_edit tool to perform the following benchmark tests and report results:

### Test Files Available:
- **benchmark-sample.txt**: Contains 5 lines of sample content
- **benchmark-large.txt**: Contains 100 lines for performance testing  
- **benchmark-empty.txt**: Empty file for edge case testing

### Benchmark Test Suite

**Test 1: Insert at Beginning**
- Use fs_file_edit on benchmark-sample.txt
- Insert "NEW: First line inserted" at line 1 with deleteCount 0
- Verify the new line appears at the beginning

**Test 2: Insert in Middle** 
- Use fs_file_edit on benchmark-sample.txt 
- Insert 2 lines at line 3: "NEW: Inserted in middle" and "NEW: Another inserted line"
- Verify both lines are inserted correctly

**Test 3: Delete Single Line**
- Use fs_file_edit on benchmark-sample.txt
- Delete line 2 (deleteCount 1, empty lines array)
- Verify line was removed and file structure is correct

**Test 4: Delete Multiple Lines**
- Use fs_file_edit on benchmark-sample.txt  
- Delete 3 lines starting at line 2 (deleteCount 3)
- Verify multiple lines removed correctly

**Test 5: Replace Single Line**
- Use fs_file_edit on benchmark-sample.txt
- Replace line 3 with "REPLACED: This line was replaced"
- Verify replacement occurred correctly

**Test 6: Replace with Expansion**
- Use fs_file_edit on benchmark-sample.txt
- Replace 2 lines starting at line 2 with 3 new lines
- Verify file expanded correctly

**Test 7: Empty File Operations**
- Use fs_file_edit on benchmark-empty.txt
- Insert "First line in empty file" at line 1
- Verify operation works on empty file

**Test 8: Large File Performance**
- Use fs_file_edit on benchmark-large.txt
- Insert/replace content at line 50
- Verify tool handles larger files efficiently

**Test 9: Error Handling - Invalid Line**
- Attempt fs_file_edit with insertLine beyond file length
- Verify tool returns appropriate error message

**Test 10: Error Handling - Delete Overflow**
- Attempt fs_file_edit with deleteCount exceeding available lines
- Verify tool handles boundary errors gracefully

### Reporting Requirements

For each test:
1. **Execute** the fs_file_edit operation
2. **Verify** the result by reading the file content  
3. **Report** success/failure with specific details
4. **Measure** performance where applicable

Provide a comprehensive summary of:
- Total tests passed/failed
- Performance characteristics
- Tool reliability assessment
- Any edge cases discovered

Execute these benchmarks systematically and report detailed results for each test case.

All file edit benchmarks completed`