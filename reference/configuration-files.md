import { Code } from "@astrojs/starlight/components"
import schema from "../../../../public/schemas/config.json?raw"

GenAIScript supports local and global configuration files to allow reusing common configuration settings and secrets across multiple scripts.

## .env file resolution

GenAIScript will scan, load the following `.env` files in the following order:

- `envFile` property in the configuration files (see below)
- `GENAISCRIPT_ENV_FILE` environment variable
- `--env` command line options

```sh
genaiscript run ... --env ./.env.debug --env ~/.env.dev
```

If none of the above are set, it will try to load the following files:

- `~/.env`
- `./.env`
- `./.env.genaiscript`

### config file resolution

GenAIScript will scan for the following configuration files
and merge their content into the final configuration.

- `~/genaiscript.config.yaml`
- `~/genaiscript.config.json`
- `./genaiscript.config.yaml`
- `./genaiscript.config.json`

The JSON files support the [JSON5](https://json5.org/) format (including comments, trailing commas, etc...).

## Schema

The configuration schema is at https://microsoft.github.io/genaiscript/schemas/config.json .

<Code code={schema} wrap={true} lang="json" />

## `envFile` property

The final location of `envFile` will be used to load the secret in the environment variables. It supports a single

## `include` property

The `include` property allows you to provide glob paths to include more scripts.
Combined with a global configuration file, this allows to share script for a number of projects.

```yaml title="genaiscript.config.yaml"
include:
    - "globalpath/*.genai.mjs"
```

## `modelAliases` property

The `modelAliases` property allows you to provide aliases for model names.

```js
{
    "modelAliases": {
        "llama32": "ollama:llama3.2:1b",
        "llama32hot": {
            "model": "ollama:llama3.2:1b",
            "temperature": 2
        }
    }
}
```

## `modelEncodings` property

The `modelEncodings` property allows you to provide the encoding for the model.

```js
{
    "modelEncodings": {
        "azure:gpt__4o_random_name": "gpt-4o"
    }
}
```

## `allowedDomains` property

The `allowedDomains` property controls which domains are allowed for HTTPS resource resolution via `host.resolveResource()` and `host.fetchText()`. 
By default, all domains are allowed (`*`) for convenience, but you can restrict access for security.

:::note[Important: API-Level Filtering Only]
Domain filtering **only applies to GenAIScript's host APIs** (`host.fetchText`, `host.resolveResource`). It does **NOT** restrict:
- Global `fetch()` function
- Third-party libraries making HTTP requests
- Direct network calls from imported packages

This is not an egress proxy - for broader network security, use firewalls or other network-level controls.
:::

```yaml title="genaiscript.config.yml"
allowedDomains:
  - github.com
  - '*.github.com'
  - '*.githubusercontent.com'
  - '*.openai.com'
  - example.org
```

```json title="genaiscript.config.json"
{
    "allowedDomains": [
        "github.com", 
        "*.github.com", 
        "*.githubusercontent.com",
        "*.openai.com",
        "example.org"
    ]
}
```

### Wildcard Patterns

Domain patterns support glob-style wildcards:
- `github.com` - Exact match only
- `*.github.com` - Matches any subdomain (e.g., `api.github.com`)
- `*` - Matches all domains (use with caution)

### Environment Variable

You can also configure allowed domains via environment variables:

```bash
# Comma-separated list
GENAISCRIPT_ALLOWED_DOMAINS=github.com,*.openai.com,example.org

# YAML array format  
GENAISCRIPT_ALLOWED_DOMAINS='["github.com", "*.openai.com", "example.org"]'
```

When a domain is blocked, you'll see a clear error message explaining how to configure allowed domains.

### Script-Level Override

Individual scripts can override the global `allowedDomains` configuration by specifying their own list:

```js
script({
  title: "API Integration Script",
  allowedDomains: [
    "github.com",
    "*.api.example.com",
    "secure.partner.org"
  ]
})

// This script can only access the domains listed above,
// regardless of global configuration
const data = await host.fetchText("https://api.example.com/data")
```

Script-level configuration takes precedence over global settings, providing fine-grained security control per script.

## Debugging

Enable the `config` debug category to see additional information about the configuration resolution.

You can also enable other debug categories for more detailed logs.

```sh
DEBUG=config genaiscript run ...
```