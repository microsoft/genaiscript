---
title: Concurrency
description: How to run multiple prompts concurrently
sidebar:
  order: 50
hero:
  image:
    alt: A minimalist 2D 8-bit image depicts three colored geometric boxes,
      symbolizing promises, advancing side by side on a horizontal conveyor belt
      with three lanes, and each sliding into separate square slots that
      represent concurrent execution. Additional boxes form a queue, ready to
      enter the belt. The design is flat, geometric, uses only five colors, has
      no characters, background, or shadows, and maintains a small, iconic
      appearance.
    file: ./concurrency.png
llmstxt:
  content: >-
    GenAI programs often idle while waiting for LLM tokens. JavaScript's `async`
    and `await` enable non-blocking asynchronous execution. For example:


    ```js

    async function work() { ... }

    await work()

    ```


    Serial execution processes LLM queries one-by-one:


    ```js

    const poem = await prompt`write a poem`

    const essay = await prompt`write an essay`

    ```


    Concurrent execution speeds up processing:


    ```js

    const [poem, essay] = await Promise.all(
        prompt`write a poem`,
        prompt`write an essay`
    )

    ```


    However, excessive concurrent requests may hit rate limits. GenAIScript
    automatically limits concurrent requests per model.


    A promise queue ensures controlled concurrency. Wrap promises in functions:


    ```js

    const queue = host.promiseQueue(3)

    const res = await queue.all([
        () => prompt`write a poem`,
        () => prompt`write an essay`
    ])

    ```


    Use `mapAll` for arrays:


    ```js

    const queue = host.promiseQueue(3)

    const summaries = await queue.mapAll(
        env.files,
        (file) => prompt`Summarize ${file}`
    )

    ```
  hash: 5d95c1aac10a89b5eccafbb880a166e32cca403dd772998dfc02050236ca8c2c

---

When working with GenAI, your program will likely be idle, waiting for tokens to return from the LLM.

## await and async

JavaScript has a wonderful support for non-blocking asynchronous APIs using [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

```js
// takes a while
async function workM() { ... }

// let other threads work while this function is running
await work()
```

This feature is leveraged in [inline prompts](/genaiscript/reference/scripts/inline-prompts) to wait for a LLM result or run multiple queries concurrently.

## Serial vs concurrent execution

In this example, we run each LLM queries 'serially' using `await`:

```js
const poem = await prompt`write a poem`
const essay = await prompt`write an essay`
```

However, we can run all queries 'concurrently' to speed things up:

```js
const [poem, essay] = await Promise.all(
    prompt`write a poem`,
    prompt`write an essay`
)
```

This works, but it may become problematic if you have many entries, as you will create numerous requests concurrently and likely hit some rate-limiting boundaries.
Note that GenAIScript automatically limits the number of concurrent requests to a single model to prevent this scenario.

## Promise queue

The promise queue provides a way to run promises concurrently with a guaranteed concurrency limit, specifying how many are allowed to run at the same time.
The difference with `Promise.all` is that you wrap each promise in a function.

```js
const queue = host.promiseQueue(3)
const res = await queue.all([
    () => prompt`write a poem`
    () => prompt`write an essay`
])
```

Use the `mapAll` function to iterate over an array.

```js
const queue = host.promiseQueue(3)
const summaries = await queue.mapAll(
    env.files,
    (file) => prompt`Summarize ${file}`
)
```
