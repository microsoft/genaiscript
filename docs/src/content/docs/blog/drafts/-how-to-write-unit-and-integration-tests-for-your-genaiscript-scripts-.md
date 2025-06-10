---
title: '"How to Write Unit and Integration Tests for Your GenAIScript Scripts"'
date: 2025-06-07
authors: genaiscript
draft: true
tags:
  - testing
  - quality
  - integration
  - unit
  - guide
  - genaiscript

---

# "How to Write Unit and Integration Tests for Your GenAIScript Scripts"

Testing is a core pillar of reliable software development 🛡️—and writing scripts in GenAIScript is no exception! In this post, we’ll walk through concrete examples of **unit tests**, **integration tests**, **error handling**, and **asynchronous tests** in a GenAIScript script. Every line will be explained, so you can confidently apply these testing techniques to your automation and AI-powered workflows.

> For a comprehensive overview of GenAIScript and its testing features, check out the [official documentation](https://microsoft.github.io/genaiscript/).

---

## Why Testing Matters in GenAIScript

Before we dive in: testing your scripts ensures that they work as expected, stay stable as you add features, and handle failures gracefully. Whether you're automating document pipelines or coding up agent workflows, confidence in your script's correctness is priceless.

---

## The Example Script

Let’s break down a complete GenAIScript file that demonstrates best practices in testing:



```js
// GenAIScript: How to Write Unit and Integration Tests for Your GenAIScript Scripts
// This script demonstrates basic unit and integration testing patterns for GenAIScript scripts.
```

- **Purpose**: This comment declares the script’s intent. (Every good file starts with a clear comment!)

---

### --- Unit Test Example ---

```js
// A simple function to add two numbers
function add(a, b) {
    return a + b;
}
```
- **function add(a, b)**: Defines a function named `add` that takes two arguments and returns their sum. Super simple and a great candidate for unit testing!

---

```js
// Unit test for add()
test('add() adds two positive numbers', () => {
    const result = add(2, 3);
    assert.equal(result, 5, '2 + 3 should be 5');
});
```
- **test('add() adds two positive numbers', ...)**: Begins a unit test named `add() adds two positive numbers`.
- **const result = add(2, 3);**: Executes `add` with the inputs 2 and 3.
- **assert.equal(result, 5, '2 + 3 should be 5');**: Asserts that the result should be 5. If not, the test fails with the message.

```js
test('add() adds negative numbers', () => {
    const result = add(-2, -3);
    assert.equal(result, -5, '-2 + -3 should be -5');
});
```
- Another **unit test**, checking negative inputs. The pattern is the same—construct the inputs, run the function, assert the expected output.

---

### --- Integration Test Example ---

```js
// A function that uses add() and multiplies the result
function addAndMultiply(a, b, multiplier) {
    const sum = add(a, b);
    return sum * multiplier;
}
```
- **function addAndMultiply(a, b, multiplier)**: Uses the `add` function, then multiplies the sum. This composition makes it ideal for an **integration test**.

```js
test('addAndMultiply() integrates add() and multiplication', () => {
    const result = addAndMultiply(2, 3, 4);
    assert.equal(result, 20, '(2 + 3) * 4 should be 20');
});
```
- **test('addAndMultiply() integrates add() and multiplication', ...)**: An integration test. It checks that combining `add` and multiplication produces the expected outcome.

---

### --- Error Handling Test ---

```js
test('add() throws on non-numeric input', () => {
    assert.throws(() => add('a', 2), 'should throw if non-numeric');
});
```
- **assert.throws(() => add('a', 2), ...)**: Asserts that running `add` with a string will throw an error. This ensures invalid usage is safely caught.

---

### --- Asynchronous Test Example ---

```js
async function fetchData() {
    // Simulate async fetch
    await sleep(10);
    return { status: 'ok', value: 42 };
}
```
- **async function fetchData()**: An asynchronous function that simulates a data fetch by awaiting a `sleep`.
- **await sleep(10);**: Pauses for 10 milliseconds (learn more about sleep patterns in [the GenAIScript reference](https://microsoft.github.io/genaiscript/reference/standard-library/)).
- **return { status: 'ok', value: 42 };**: Returns a mock response object.

```js
test('fetchData() returns correct value', async () => {
    const data = await fetchData();
    assert.equal(data.status, 'ok');
    assert.equal(data.value, 42);
});
```
- **test('fetchData() returns correct value', async () => ... )**: Declares an asynchronous test.
- **const data = await fetchData();**: Calls and awaits the async function.
- **assert.equal(data.status, 'ok');**: Checks that the `status` property is correct.
- **assert.equal(data.value, 42);**: Checks that the `value` property is correct.

---

### --- Test Runner Entry Point ---

```js
run();
```
- **run();**: The required call at the bottom of your GenAIScript test suite. It executes all defined tests and prints results.

---

## Tips and Best Practices

- **Use clear, descriptive test names** so that failures are easy to interpret.
- **Test both normal and error conditions** to guard against edge cases.
- **Include integration tests** for logic that composes multiple functions.
- **Leverage async testing features** for code involving fetches, waits, or asynchronous steps.

## Want More?

- For advanced testing, see the [GenAIScript Standard Library testing section](https://microsoft.github.io/genaiscript/reference/standard-library/testing/).
- Explore real-world scripts under `packages/sample/src/` for more patterns!

---

## Wrapping Up

Writing and running both unit and integration tests in your GenAIScript scripts keeps your automations robust, maintainable, and bug-free 🚀. With these patterns, you’re empowered to experiment with confidence—knowing your logic will behave as expected from the start!

Happy scripting and happy testing!