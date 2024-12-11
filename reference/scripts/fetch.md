
The JavaScript `fetch` API is available; but we also provide a helper
`fetchText` for issuing requests into a friendly format.

## `host.fetch`

The `host.fetch` function is a wrapper around the global `fetch` function which adds builtin proxy support and retry capabilities.

```js
const response = await host.fetch("https://api.example.com", { retries: 3 })
```

## `host.fetchText`

Use `host.fetchText` to issue requests and download text from the internet.

```ts
const { text, file } = await host.fetchText("https://....")
if (text) $`And also ${text}`

def("FILE", file)
```

fetchText will also resolve the contents of file in the current workspace if the url is a relative path.

```ts
const { file } = await host.fetchText("README.md")
def("README", file)
```

## Secrets

If the API you are querying requires an API key, you can use the [secrets](/genaiscript/reference/scripts/secrets) object to store the key.
