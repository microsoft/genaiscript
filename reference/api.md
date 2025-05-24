import { Tabs, TabItem } from "@astrojs/starlight/components"
import { PackageManagers } from "starlight-package-managers"

GenAIScript runs in a (slightly modified) Node.JS environment where additional globals have been added.
This environment is configured by the [cli](/genaiscript/reference/cli).
Therefore, in order to run a GenAIScript in a "vanialla" Node.JS process, you will need to the
**Node.JS `run` API**. This API loads and executes a GenAIScript script in a separate worker thread.

This page describes how to import and use the GenAIScript as an API in your Node.JS application.

## Configuration

Assuming you have have added the cli as a dependency in your project,
you can import the [cli](/genaiscript/reference/api) as follows:

<PackageManagers pkg="genaiscript" dev />

The API can be imported using imports from **"genaiscript/api"**.

```js wrap
import { run } from "genaiscript/api"
```

The imported `api.mjs` wrapper is a tiny, zero dependency loader that
spawns a [Node.JS worker thread](https://nodejs.org/api/worker_threads.html) to run GenAIScript.

- No pollution of the globals
- No side effects on the process

## `run`

The `run` function wraps the [cli run](/genaiscript/reference/cli/run) command.

```js wrap
import { run } from "genaiscript/api"

const results = await run("summarize", ["myfile.txt"])
```

### Environment variables

You can set the environment variables for the GenAIScript process by passing an object as the `env` field in the options. By default, the worker will inherit `process.env`.

```js wrap
const results = await run("summarize", ["myfile.txt"], {
    env: {
        MY_ENV_VAR: "value",
    },
})
```