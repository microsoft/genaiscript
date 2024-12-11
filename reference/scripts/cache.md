
import { FileTree } from "@astrojs/starlight/components"

LLM requests are **NOT** cached by default. However, you can turn on LLM request caching from `script` metadata or the CLI arguments.

```js "cache: true"
script({
    ...,
    cache: true
})
```

or

```sh "--cache"
npx genaiscript run ... --cache
```

The cache is stored in the `.genaiscript/cache/chat.jsonl` file. You can delete this file to clear the cache.
This file is excluded from git by default.

<FileTree>

-   .genaiscript
    -   cache
        -   chat.jsonl

</FileTree>

## Custom cache file

Use the `cacheName` option to specify a custom cache file name.
The name will be used to create a file in the `.genaiscript/cache` directory.

```js
script({
    ...,
    cache: "summary"
})
```

Or using the `--cache-name` flag in the CLI.

```sh
npx genaiscript run .... --cache-name summary
```

<FileTree>

-   .genaiscript
    -   cache
        -   summary.jsonl

</FileTree>

## Programmatic cache

You can instantiate a custom cache object to manage the cache programmatically.

```js
const cache = await workspace.cache("summary")
// write entries
await cache.set("file.txt", "...")
// read value
const content = await cache.get("file.txt")
// list keys
const keys = await cache.keys()
// list values
const values = await cache.values()
```
