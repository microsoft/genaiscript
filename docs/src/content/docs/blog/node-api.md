---
title: Node.JS API
date: 2024-12-10
authors:
    - pelikhan
tags: ["sdk", "automation", "dev", "api"]
description: Learn about the new API to call genaiscript for other typescript scripts.
---

A long standing feature request has been to run GenAIScript programmatically from other scripts. We are happy to announce that we have released a Node.JS API for GenAIScript. This API allows you to call GenAIScript from other TypeScript scripts (v1.83+).

- [Documentation](https://microsoft.github.io/genaiscript/reference/cli/api/)

## Installation

You'll want to add [genaiscript](https://www.npmjs.com/package/genaiscript) as a (dev) dependency to your project.

```sh
npm install -D genaiscript
```

## The `run` API

The `run` API is meant to mimic the behavior of the GenAIScript CLI. It takes the same arguments as the CLI and returns the same results. This allows you to call GenAIScript from other TypeScript scripts.

```js
import { run } from "genaiscript/api"
const results = await run("summarize", ["myfile.txt"])
```

The result object contains the full list of messages, and additional parsed information like modified files, diagnostics and so forth.

## Don't mess with my process

On the caller side, the [run implementation](https://github.com/microsoft/genaiscript/blob/main/packages/cli/src/api.ts) is a dependency free, side effect free function. It spawns a worker thread where GenAIScript does the work.

- No global added
- No package loaded
- A few hunbred `b` of memory used

## Help us improve it!

Obvisouly this is a first draft and we could do a better job at providing callbacks for progress. Send us your feedback!
