---
title: Cache
sidebar:
    order: 15
---

LLM requests are cached by default. This means that if a script generates the same prompt for the same model, the cache may be used.

-   the temperature is less than 0.5 (can be configured in user settings
-   the top_p is less than 0.5 (can be configured in user settings)
-   no tools/functions (`defFunction`) are used as they introduce randomness
-   `seed` is not used

The cache is stored in the `.genaiscript/cache/chat.jsonl` file. You can delete this file to clear the cache.

## Configuration the cache behavior

You can always enable or disable the cache using the `cache` option in `script`.

```js
script({
    ...,
    cache: false
})
```

Or using the `--cache` flag in the CLI.

```sh
npx genaiscript run .... --cache
```
