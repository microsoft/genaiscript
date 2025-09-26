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

Domain filtering restricts which domains can be accessed through GenAIScript's `host` APIs (`host.fetchText`, `host.resolveResource`). By default, all domains are allowed (`*`) for convenience, but you can configure specific restrictions.

:::note[Scope of Domain Filtering]
Domain filtering **only applies to GenAIScript's host APIs** (`host.fetchText`, `host.resolveResource`). It does **NOT** affect:
- Global `fetch()` function
- Third-party libraries making HTTP requests  
- Direct network calls from imported packages

This is not an egress proxy - it's API-level filtering for GenAIScript's built-in network functions only.
:::

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
Domain 'example.com' is not allowed. Allowed domains: *.
Configure allowed domains via GENAISCRIPT_ALLOWED_DOMAINS environment variable or allowedDomains in script configuration.
```

## Secrets

If the API you are querying requires an API key, you can use the [secrets](/genaiscript/reference/scripts/secrets) object to store the key.

```

```