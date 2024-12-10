
import { Steps } from "@astrojs/starlight/components"
import { FileTree } from "@astrojs/starlight/components"

Scripts using the `.mjs` extension can use static or dynamic imports as any other module file.
You can rename any `.genai.js` file to `.genai.mjs` to enable module imports.

## Module Imports

You can import node packages installed in your project.

```js
import { parse } from "ini"

// static import
const res = parse("x = 1\ny = 2")
console.log(res)

// dynamic import with top-level await
const { stringify } = await import("ini")
console.log(stringify(res))
```

## JavaScript imports

You can also import other local **JavaScript** files (using static or dynamic imports).

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

[TypeScript module files](/genaiscript/reference/scripts/typescript) (`.mts`) can be imported using **dynamic** import only.

```js title="summarizer.mts"
export function summarize(files: string[]) {
    def("FILE", files)
    $`Summarize each file. Be concise.`
}
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

## Default function export

If you set a function as the default export, GenAIScript will call it.
The function can be async.

```js title="poem.genai.mjs" "export default async function() {" "}"
script(...)
export default async function() {
    $`Write a poem.`
}
```
