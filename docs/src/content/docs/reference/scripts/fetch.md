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
llmstxt:
  content: >-
    The `host.fetch` function wraps the global `fetch` API, adding proxy support
    and retries. Example: `await host.fetch("https://api.example.com", {
    retries: 3 })`.


    `host.fetchText` simplifies fetching and downloading text. Example: `const {
    text, file } = await host.fetchText("https://...")`. For relative paths, it
    resolves files in the current workspace. Example: `const { file } = await
    host.fetchText("README.md")`.


    `fetchText` can convert HTML to markdown or plain text for context-efficient
    use. Example: `await host.fetch("https://...", { convert: "markdown" })`.


    `host.resolveResource` resolves and downloads resources from URLs, handling
    various protocols and GitHub blob-to-raw transformations. It returns a
    resolved URL and an array of files with content. Example: 

    `const result = await host.resolveResource("https://github.com/...")`.


    For APIs requiring keys, use the `secrets` object to store credentials.
  hash: 817b969dd5c11137341de717ef94c59fe25955dc2b6fcb16553094751a632adc

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

## `host.resolveResource`

Use `host.resolveResource` to resolve and download resources from URLs. This function handles various URL schemes and protocols, 
and can resolve GitHub blob URLs to raw content, among other transformations.

```ts
const result = await host.resolveResource("https://github.com/microsoft/genaiscript/blob/main/docs/public/images/favicon.png")
if (result) {
  console.log(`Resolved URI: ${result.uri}`)
  for (const file of result.files) {
    console.log(`File: ${file.filename}`)
    if (file.content) {
      console.log(`Binary content: ${file.content.length} bytes`)
    } else if (file.text) {
      console.log(`Text content: ${file.text.length} characters`)
    }
  }
}
```

The function returns an object with:
- `uri`: The resolved URL as a URL object
- `files`: An array of resolved files with their content

### Domain Filtering

For security, HTTPS resource resolution is restricted to allowed domains. By default, GitHub domains are allowed:
- `github.com`
- `*.github.com` 
- `*.githubusercontent.com`

#### Configuration

You can configure allowed domains in several ways:

**Environment Variables:**
```bash
# Comma-separated list
GENAISCRIPT_ALLOWED_DOMAINS=github.com,*.openai.com,example.org

# YAML array format
GENAISCRIPT_ALLOWED_DOMAINS='["github.com", "*.openai.com", "example.org"]'
```

**Configuration File (genaiscript.config.yml):**
```yaml
allowedDomains:
  - github.com
  - '*.openai.com'
  - example.org
```

**Configuration File (genaiscript.config.json):**
```json
{
  "allowedDomains": ["github.com", "*.openai.com", "example.org"]
}
```

**Script-Level Configuration:**
Individual scripts can specify their own allowed domains, which override the global configuration:

```js
script({
  title: "My Script",
  allowedDomains: [
    "github.com",
    "*.openai.com", 
    "example.com"
  ]
})

// This script can only access the domains listed above
const response = await host.fetchText("https://api.openai.com/data")
```

Script-level configuration takes precedence over global settings, allowing fine-grained control over domain access per script.

#### Wildcard Patterns

Domain patterns support glob-style wildcards using [minimatch](https://github.com/isaacs/minimatch):
- `github.com` - Exact match only
- `*.github.com` - Matches any subdomain (e.g., `api.github.com`)
- `*` - Matches all domains (use with caution)

When a domain is blocked, you'll see an error message like:
```
Domain 'example.com' is not allowed. Allowed domains: github.com, *.github.com, *.githubusercontent.com.
Configure allowed domains via GENAISCRIPT_ALLOWED_DOMAINS environment variable or allowedDomains in config file.
```

## Secrets

If the API you are querying requires an API key, you can use the [secrets](/genaiscript/reference/scripts/secrets) object to store the key.

```

```
