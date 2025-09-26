import { FileTree } from "@astrojs/starlight/components"

Par défaut, les requêtes LLM ne sont **PAS** mises en cache. Cependant, vous pouvez activer la mise en cache des requêtes LLM à partir des métadonnées de `script` ou des arguments de la CLI.

```js "cache: true"
script({
    ...,
    cache: true
})
```

ou

```sh "--cache"
npx genaiscript run ... --cache
```

Le cache est stocké dans le fichier `.genaiscript/cache/chat.jsonl`. Vous pouvez supprimer ce fichier pour vider le cache. Ce fichier est exclu de git par défaut.

<FileTree>
  * .genaiscript
    * cache
      * chat.jsonl
</FileTree>

## Fichier de cache personnalisé

Utilisez l'option `cacheName` pour spécifier un nom de fichier de cache personnalisé. Ce nom sera utilisé pour créer un fichier dans le répertoire `.genaiscript/cache`.

```js
script({
    ...,
    cache: "summary"
})
```

Ou en utilisant l'option `--cache-name` dans la CLI.

```sh
npx genaiscript run .... --cache-name summary
```

<FileTree>
  * .genaiscript
    * cache
      * summary.jsonl
</FileTree>

## Cache programmatique

Vous pouvez instancier un objet de cache personnalisé pour gérer le cache de manière programmatique.

```js
const cache = await workspace.cache("custom")
// write entries
await cache.set("file.txt", "...")
// read value
const content = await cache.get("file.txt")
// list values
const values = await cache.values()
```