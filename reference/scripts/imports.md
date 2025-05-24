import { Steps } from "@astrojs/starlight/components"
import { FileTree } from "@astrojs/starlight/components"

Scripts using the `.mjs` extension can use static or dynamic imports as any other module file.
You can rename any `.genai.js` file to `.genai.mjs` to enable module imports.

## Module Imports

You can import node packages installed in your project
in `.mjs` or `.mts`.

```js title="script.genai.mjs"
import { parse } from "ini"

// static import
const res = parse("x = 1\ny = 2")
console.log(res)

// dynamic import with top-level await
const { stringify } = await import("ini")
console.log(stringify(res))
```

## JavaScript imports

You can also import other local **JavaScript** module files (using static or dynamic imports).
**Use `.mjs` extension for module JavaScript files.**

```js title="summarizer.mjs"
export function summarize(files) {
    def("FILE", files)
    $`Summarize each file. Be concise.`
}
```

- static import (`import ... from ...`)

```js
import { summarize } from "./summarizer.mjs"
summarize(env.generator, env.files)
```

- dynamic import (`async import(...)`)

```js
const { summarize } = await import("./summarizer.mjs")
summarize(env.generator, env.files)
```

## TypeScript imports

You can import [TypeScript module files](/genaiscript/reference/scripts/typescript) (`.mts`).
**Use `.mts` extension for module TypeScript files.**

```js title="summarizer.mts"
export function summarize(files: string[]) {
    def("FILE", files)
    $`Summarize each file. Be concise.`
}
```

- static import (`import ... from ...`)

```js
import { summarize } from "./summarizer.mts"
summarize(env.generator, env.files)
```

- dynamic import (`async import(...)`)

```js
const { summarize } = await import("./summarizer.mts")
summarize(env.generator, env.files)
```

## `env.generator`

The `env.generator` references the root prompt generator context, the top level `$`, `def` functions... It can be used to create function that can be used with those function or also with `runPrompt`.

```js "_"
export function summarize(_, files) {
    _.def("FILE", files)
    _.$`Summarize each file. Be concise.`
}
```

## JSON Modules

You can import JSON files using the `import` statement and get automatic type inference.

```js title="data.json"
{
    "name": "GenAIScript"
}
```

Use the `with { type: "json" }` syntax to import JSON files in `.mjs` or `.mts` files.
The file path is relative to the genaiscript source file.

```js title="script.genai.mts"
import data from "./data.json" with { type: "json" }

console.log(data.name) // GenAIScript
```

## Default function export

If you set a function as the default export, GenAIScript will call it.
The function can be async.

```js title="poem.genai.mjs" "export default async function() {" "}"
script(...)
export default async function() {
    $`Write a poem.`
}
```

## Package type

If you have a `package.json` file in your project, you can set the `type` field to `module` to enable module imports in all `.js` files.

```json
{
    "type": "module"
}
```

This will allow you to use module imports in all `.js` files in your project.

## Current script file

You can use the `import.meta.url` to get the current script file URL.
This is useful to get the current script file path and use it in your script.

```js title="script.genai.mjs"
// convert file:// to absolute path
const filename = path.resolveFileURL(import.meta.url)
```