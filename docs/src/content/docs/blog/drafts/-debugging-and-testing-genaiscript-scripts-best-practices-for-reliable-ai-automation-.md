---
title: '"Debugging and Testing GenAIScript Scripts: Best Practices for Reliable
  AI Automation"'
date: 2025-05-18
authors: genaiscript
draft: true
tags:
  - debugging
  - testing
  - genaiscript
  - best-practices
  - automation

---

# "Debugging and Testing GenAIScript Scripts: Best Practices for Reliable AI Automation"

Robust AI automation starts with reliable scripts—and the best way to achieve that is by building strong debugging and testing habits. In this post, we walk through a hands-on GenAIScript sample, explaining every line and showing you exactly how to make your scripts dependable, maintainable, and easy to troubleshoot.

---

## 🚦 Why Test and Debug GenAIScript Code?

When automating with GenAIScript, debugging and testing ensures:

- Your logic works as expected
- Corner cases and invalid inputs don’t crash your automation
- Future changes don’t break existing behavior

Let's break down a practical script that demonstrates recommended techniques.

---

## 🧑‍💻 Script Overview

Below is a GenAIScript designed for debugging and testing:

```js
// Debugging and Testing GenAIScript Scripts: Best Practices for Reliable AI Automation

// This script demonstrates best practices for debugging and testing GenAIScript scripts.
// It includes: assertions, logging, error handling, and test case simulation.

// Utility: Simple logger for debugging
function logDebug(message, data) {
    console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
}

// Utility: Assertion helper
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Example function: Adds two numbers
function add(a, b) {
    logDebug('add() called with', { a, b });
    assert(typeof a === 'number', 'First argument must be a number');
    assert(typeof b === 'number', 'Second argument must be a number');
    const result = a + b;
    logDebug('add() result', result);
    return result;
}

// Test cases for add()
function testAdd() {
    logDebug('Running testAdd()');
    // Normal case
    assert(add(2, 3) === 5, '2 + 3 should be 5');
    // Edge case: zero
    assert(add(0, 0) === 0, '0 + 0 should be 0');
    // Negative numbers
    assert(add(-2, -3) === -5, '-2 + -3 should be -5');
    // Error case: invalid input
    let errorCaught = false;
    try {
        add('a', 3);
    } catch (e) {
        errorCaught = true;
        logDebug('Caught expected error', e.message);
    }
    assert(errorCaught, 'Should throw error for invalid input');
    logDebug('testAdd() passed');
}

// Main script execution
function main() {
    logDebug('Starting GenAIScript debugging and testing demo');
    try {
        testAdd();
        logDebug('All tests passed!');
    } catch (e) {
        console.error('[ERROR] Test failed:', e.message);
    }
}

main();
```

Now, let's walk through it line by line!

---

## 🔍 Step-by-Step Explanation

### File Overview

```js
// Debugging and Testing GenAIScript Scripts: Best Practices for Reliable AI Automation

// This script demonstrates best practices for debugging and testing GenAIScript scripts.
// It includes: assertions, logging, error handling, and test case simulation.
```
A brief introduction clarifies the purpose: demonstrating effective debugging and testing.

---

### Logging for Debugging

```js
function logDebug(message, data) {
    console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
}
```
**What it does**:  
Defines `logDebug`, a helper function that prints clearly tagged debug messages to the console.  
- `message` is the info you want logged.
- `data` is any object or value to include for context (optional).

**Why it matters**:  
Readable, consistent logs make it easy to trace execution and diagnose issues.

---

### Asserting Conditions

```js
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
```
**What it does**:  
`assert` is a classic testing building block.  
- Throws an error (and halts execution) if a condition isn’t met.
- `message` describes what went wrong (great for debugging).

**Why it matters**:  
Assertions help you catch bugs *immediately* and ensure critical assumptions always hold.

---

### Example Function: `add`

```js
function add(a, b) {
    logDebug('add() called with', { a, b });
    assert(typeof a === 'number', 'First argument must be a number');
    assert(typeof b === 'number', 'Second argument must be a number');
    const result = a + b;
    logDebug('add() result', result);
    return result;
}
```
**What it does**:  
Performs a safe addition of two numbers, with all the right checks:  
1. Logs its input arguments.  
2. Checks each argument is a number.  
3. Logs the result.  
4. Returns the sum.

**Why it matters**:  
Type checking with assertions prevents subtle errors (e.g., adding strings or other types).

---

### Automated Test Cases

```js
function testAdd() {
    logDebug('Running testAdd()');
    // Normal case
    assert(add(2, 3) === 5, '2 + 3 should be 5');
    // Edge case: zero
    assert(add(0, 0) === 0, '0 + 0 should be 0');
    // Negative numbers
    assert(add(-2, -3) === -5, '-2 + -3 should be -5');
    // Error case: invalid input
    let errorCaught = false;
    try {
        add('a', 3);
    } catch (e) {
        errorCaught = true;
        logDebug('Caught expected error', e.message);
    }
    assert(errorCaught, 'Should throw error for invalid input');
    logDebug('testAdd() passed');
}
```
**What it does**:  
Provides a suite of test cases for `add`:  
- Verifies normal input.
- Checks edge cases (zero, negatives).
- Ensures errors are thrown (e.g., using non-number inputs).

**Why it matters**:  
Testing with assertions and error handling builds trust that your function performs correctly, and fails *safely* for bad input.

---

### Running Everything: The Entry Point

```js
function main() {
    logDebug('Starting GenAIScript debugging and testing demo');
    try {
        testAdd();
        logDebug('All tests passed!');
    } catch (e) {
        console.error('[ERROR] Test failed:', e.message);
    }
}

main();
```
**What it does**:  
- Invokes `testAdd`.
- Runs inside a try/catch block—the script will log a comprehensible error if a test fails.

**Why it matters**:  
Global error handling guarantees you never miss a failed test or silent bug.

---

## 🚀 Best Practices You Should Steal

- **Use logging:** Trace every step for easy troubleshooting.
- **Assert aggressively:** Fail early if expectations aren’t met.
- **Write isolated test functions:** Exercise all typical and edge cases.
- **Test error handling:** Deliberately trigger and check for expected failures.
- **Wrap your main logic:** Don’t let a failing test or exception escape silently.

For more real-world GenAIScript code examples, check the [`packages/sample/src`](https://github.com/microsoft/genaiscript/tree/main/packages/sample/src) directory in the official repository.

---

## 📚 Learn More

- [Official GenAIScript Documentation](https://microsoft.github.io/genaiscript/)
- [API Reference](https://microsoft.github.io/genaiscript/docs/reference)
- Other [blog posts](../blog/) on scripting tips and automation best practices

---

By adopting these habits, your GenAIScript projects will be easier to maintain, safer to deploy, and way less stressful to debug! Happy scripting! 🛠️✨