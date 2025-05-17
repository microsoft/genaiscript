[TypeScript](https://www.typescriptlang.org/) is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. GenAIScript scripts can be authored in TypeScript.

## From JavaScript to TypeScript

You can convert any existing script to typescript by changing the file name extension to **`.genai.mts`**.

```js title="summarizer.mts"
def("FILE", files)
$`Summarize each file. Be concise.`
```

:::note

Make sure to use the **`.mts`** file extension - not `.ts` -, which forces Node.JS to use the [ESM](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html) module system.

:::

## Importing TypeScript source files

It is possible to [import](/genaiscript/reference/scripts/imports) TypeScript source file.

```js title="summarizer.mts"
export function summarize(files: string[]) {
    def("FILE", files)
    $`Summarize each file. Be concise.`
}
```

- import

```js
import { summarize } from "./summarizer.mts"
summarize(env.generator, env.files)
```

## Does GenAIScript type-check prompts?

Yes and No.

Most modern editors, like Visual Studio Code, will automatically
type-check TypeScript sources.

You can also run a TypeScript compilation using the `scripts compile` command.

```sh
genaiscript scripts compile
```

However, at runtime, GenAIScript converts TypeScript to JavaScript **without type checks** through [tsx](https://tsx.is/usage#no-type-checking).