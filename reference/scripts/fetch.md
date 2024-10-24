
The JavaScript `fetch` API is available; but we also provide a helper
`fetchText` for issuing requests into a friendly format.

## `fetchText`

Use `fetchText` to issue requests and download text from the internet.

```ts
const { text, file } = await fetchText("https://....")
if (text) $`And also ${text}`

def("FILE", file)
```

fetchText will also resolve the contents of file in the current workspace if the url is a relative path.

```ts
const { file } = await fetchText("README.md")
def("README", file)
```

## Secrets

If the API you are querying requires an API key, you can use the [secrets](/genaiscript/reference/scripts/secrets) object to store the key.
