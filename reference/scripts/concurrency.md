
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
const res = await queue.all(
    () => prompt`write a poem`
    () => prompt`write an essay`
)
```

Use the `mapAll` function to iterate over an array.

```js
const queue = host.promiseQueue(3)
const summaries = await queue.mapAll(
    env.files,
    (file) => prompt`Summarize ${file}`
)
```
