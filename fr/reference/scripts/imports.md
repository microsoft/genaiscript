import { Steps } from "@astrojs/starlight/components"
import { FileTree } from "@astrojs/starlight/components"

Les scripts utilisant l'extension `.mjs` peuvent utiliser des importations statiques ou dynamiques comme tout autre fichier module. Vous pouvez renommer n'importe quel fichier `.genai.js` en `.genai.mjs` pour activer les importations de modules.

## Importations de modules

Vous pouvez importer des packages Node installés dans votre projet avec l'extension `.mjs` ou `.mts`.

```js title="script.genai.mjs"
import { parse } from "ini"

// static import
const res = parse("x = 1\ny = 2")
console.log(res)

// dynamic import with top-level await
const { stringify } = await import("ini")
console.log(stringify(res))
```

## Importations JavaScript

Vous pouvez également importer d'autres fichiers modules JavaScript locaux (en utilisant des importations statiques ou dynamiques). **Utilisez l'extension `.mjs` pour les fichiers modules JavaScript.**

```js title="summarizer.mjs"
export function summarize(files) {
    def("FILE", files)
    $`Summarize each file. Be concise.`
}
```

* importation statique (`import ... from ...`)

```js
import { summarize } from "./summarizer.mjs"
summarize(env.generator, env.files)
```

* importation dynamique (`async import(...)`)

```js
const { summarize } = await import("./summarizer.mjs")
summarize(env.generator, env.files)
```

## Importations TypeScript

Vous pouvez importer des [fichiers modules TypeScript](../../../reference/reference/scripts/typescript/) (`.mts`). **Utilisez l'extension `.mts` pour les fichiers modules TypeScript.**

```js title="summarizer.mts"
export function summarize(files: string[]) {
    def("FILE", files)
    $`Summarize each file. Be concise.`
}
```

* importation statique (`import ... from ...`)

```js
import { summarize } from "./summarizer.mts"
summarize(env.generator, env.files)
```

* importation dynamique (`async import(...)`)

```js
const { summarize } = await import("./summarizer.mts")
summarize(env.generator, env.files)
```

## `env.generator`

Le `env.generator` fait référence au contexte du générateur de prompt racine, les fonctions `$`, `def` de niveau supérieur... Il peut être utilisé pour créer une fonction utilisable avec ces fonctions ou également avec `runPrompt`.

```js "_"
export function summarize(_, files) {
    _.def("FILE", files)
    _.$`Summarize each file. Be concise.`
}
```

## Modules JSON

Vous pouvez importer des fichiers JSON en utilisant l'instruction `import` et obtenir une inférence de type automatique.

```js title="data.json"
{
    "name": "GenAIScript"
}
```

Utilisez la syntaxe `with { type: "json" }` pour importer des fichiers JSON dans des fichiers `.mjs` ou `.mts`. Le chemin du fichier est relatif au fichier source genaiscript.

```js title="script.genai.mts"
import data from "./data.json" with { type: "json" }

console.log(data.name) // GenAIScript
```

## Exportation de fonction par défaut

Si vous définissez une fonction comme exportation par défaut, GenAIScript l'appellera. La fonction peut être asynchrone.

```js title="poem.genai.mjs" "export default async function() {" "}"
script(...)
export default async function() {
    $`Write a poem.`
}
```

## Type de package

Si vous avez un fichier `package.json` dans votre projet, vous pouvez définir le champ `type` sur `module` pour activer les importations de modules dans tous les fichiers `.js`.

```json
{
    "type": "module"
}
```

Cela vous permettra d'utiliser des importations de modules dans tous les fichiers `.js` de votre projet.

## Fichier de script actuel

Vous pouvez utiliser `import.meta.url` pour obtenir l'URL du fichier de script actuel. Cela est utile pour obtenir le chemin du fichier de script actuel et l'utiliser dans votre script.

```js title="script.genai.mjs"
// convert file:// to absolute path
const filename = path.resolveFileURL(import.meta.url)
```