---
title: TypeScript
sidebar:
  order: 15
description: Learn how to use TypeScript for better tooling and scalability in
  your GenAIScript projects.
keywords: TypeScript, JavaScript, ESM, dynamic imports, type checking
hero:
  image:
    alt: 'A simple 8-bit style image shows a blue file icon marked ".mts" linked
      with dotted lines to two other file icons: a dark gray one representing
      JavaScript and a light gray one for TypeScript. All icons are arranged on
      a plain white background with a geometric arrow indicating import, using
      blue, gray, black, white, and yellow. The design is flat, highly
      simplified, without people or text, and measures 128 by 128 pixels.'
    file: ./typescript.png
llmstxt:
  content: >-
    TypeScript is a strongly typed language built on JavaScript, offering better
    tooling. GenAIScript supports TypeScript for script authoring.


    To convert JavaScript to TypeScript, rename the file with a `.genai.mts`
    extension. This ensures Node.js uses the ESM module system.


    Example script:

    ```js

    def("FILE", files)

    $`Summarize each file. Be concise.`

    ```


    TypeScript files can export functions for reuse:

    ```js

    export function summarize(files: string[]) {
        def("FILE", files)
        $`Summarize each file. Be concise.`
    }

    ```

    Import and use:

    ```js

    import { summarize } from "./summarizer.mts"

    summarize(env.generator, env.files)

    ```


    Type-checking is supported in editors like VS Code and via `genaiscript
    scripts compile`. At runtime, TypeScript is converted to JavaScript without
    type checks using `tsx`.
  hash: 3fe7726d84f96d43e9817cc489812980728ccd331854a839b9ce912753b48729

---

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
