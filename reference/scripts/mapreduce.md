import { PackageManagers } from "starlight-package-managers";

The [@genaiscript/runtime](https://www.npmjs.com/package/@genaiscript/runtime) package provides
powerful map and reduce functions to process data through LLM prompts efficiently.

## Installation

<PackageManagers pkg="@genaiscript/runtime" dev />

## Map Function

The `mapPrompt` function takes a value, applies an LLM prompt then maps it to a final value.

```ts
import { mapPrompt } from "@genaiscript/runtime";
```

The following example chunks a file and applies the LLM prompt to each chunk, returning the results as an array.

```ts
const chunks = await tokenizers.chunk(env.files[0]);

const summaries = await mapPrompt(
  chunks,
  (ctx, chunk) => ctx.$`Summarize ${chunk}`,
  (res) => res.text,
  { cache: true },
);
```

The LLM prompts are executed sequentially.

## Reduce function

The `reducePrompt` function takes an array of values, applies an LLM prompt to reduce them to a single value.

```ts
import { reducePrompt } from "@genaiscript/runtime";
```

It can be useful to create a rolling summary of a document.

```ts
const summary = await reducePrompt<TextChunk, string>(
  chunks,
  (ctx, reduced, chunk) =>
    ctx.$`Summarize a large document split in chunks. The current chunk is ${chunk} and the rolling summary is ${reduced || ""}.`,
  (reduced, chunk, res) => res.text,
  "",
  { cache: true },
);
```