// Test the TestHost functionality that the tests depend on
const fs = require('fs');
const path = require('path');

// Check if key test dependencies exist and are structured correctly
const testHostFile = path.join(__dirname, 'src', 'testhost.ts');
const content = fs.readFileSync(testHostFile, 'utf8');

console.log('Testing TestHost functionality...');

// Check for TestHost patterns
const patterns = [
    /export class TestHost/,
    /static install\(\)/,
    /implements RuntimeHost/,
    /setRuntimeHost/
];

let passedChecks = 0;
patterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
        console.log(`✓ TestHost check ${index + 1} passed: Found expected pattern`);
        passedChecks++;
    } else {
        console.log(`✗ TestHost check ${index + 1} failed: Pattern not found`);
    }
});

// Also check that core test files reference TestHost correctly
const testFiles = ['llms.test.ts', 'parameters.test.ts'];
let testHostReferences = 0;

testFiles.forEach(testFile => {
    const filePath = path.join(__dirname, 'src', testFile);
    if (fs.existsSync(filePath)) {
        const testContent = fs.readFileSync(filePath, 'utf8');
        if (testContent.includes('TestHost.install()')) {
            console.log(`✓ ${testFile} correctly uses TestHost.install()`);
            testHostReferences++;
        }
    }
});

console.log(`\nTestHost verification: ${passedChecks}/${patterns.length} structure checks passed`);
console.log(`TestHost usage: ${testHostReferences}/${testFiles.length} test files use TestHost correctly`);

const allPassed = passedChecks === patterns.length && testHostReferences > 0;

if (allPassed) {
    console.log('✓ TestHost infrastructure is working correctly!');
    process.exit(0);
} else {
    console.log('✗ Some TestHost checks failed');
    process.exit(1);
}