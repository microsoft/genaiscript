---
title: Fetch
sidebar:
  order: 14
description: Learn how to use fetch and fetchText in scripts to make HTTP
  requests and handle text responses.
keywords: fetch API, fetchText, HTTP requests, scripts, API key
hero:
  image:
    alt: A small, flat 2D image in 8-bit style shows a computer screen displaying a
      simple browser window. In the window, there are four basic icons—a
      right-pointing arrow, a cloud symbolizing the internet, a file icon, and a
      gear for settings—each connected by straight lines to illustrate a
      simplified API process. The image uses only five solid corporate-style
      colors and no text, people, shadows, gradients, or backgrounds. The
      composition is strictly geometric and minimal at 128 by 128 pixels.
    file: ./fetch.png

---

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

`fetchText` will also resolve the contents of file in the current workspace if the url is a relative path.

```ts
const { file } = await host.fetchText("README.md")
def("README", file)
```

### HTML to markdown or text

`fetchText` provides various converters to extract the text from the HTML source to a more compact text representation.
If you plan to use HTML source in your LLM calls, you will surely run out of context!

```js
// markdown
const md = await host.fetch("https://...", { convert: "markdown" })
// text
const md = await host.fetch("https://...", { convert: "text" })
```

## Secrets

If the API you are querying requires an API key, you can use the [secrets](/genaiscript/reference/scripts/secrets) object to store the key.

```

```
