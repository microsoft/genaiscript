import { Code } from '@astrojs/starlight/components';
import tavilyCode from "../../../../../packages/sample/genaisrc/tavily.mjs?raw"
import scriptCode from "../../../../../packages/sample/genaisrc/document-augmentor.genai.mjs?raw"


This guide shows how to use TypeScript, a 3rd party search service, and [secrets](/genaiscript/reference/scripts/secrets) to create
a script that augments documents with information from the web.

The goal is to create a script that will augment an existing document with information
gathered from the web.


## Tavily Search

[Tavily](https://tavily.com/) is a search service optimized for LLMs that provides a [REST API](https://docs.tavily.com/docs/tavily-api/rest_api).

The REST API can be invoked using JavaScript [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
and requires an API key.

The script uses the `TAVILY_API_KEY` which will have to be declare in the script using this function.

```ts "env.secrets.TAVILY_API_KEY"
const res = await fetch(..., {
    headers: {
        'api_key': env.secrets.TAVILY_API_KEY
    }
})
```

We define a function `tavilySearch` in [TypeScript](/genaiscript/reference/scripts/typescript) that wraps the `fetch` call and we add type annotations to provide 
a nice editing experience.

```ts
export async function tavilySearch(query: string): Promise<{
    answer: string
    query: string
    results: {
        title: string
        url: string
        content: string
        score: number
    }[]
}> { ... }
```

The full source looks like this:

<Code code={tavilyCode} wrap={true} lang="ts" title="tavily.mts" />

## Question -> Search -> Augment

The script is split into 3 phases:

- run a prompt to generate a question based on the document content
- use Tavily to generate an answer to the question
- run a prompt to augment the document with the answer

The secret `TAVILY_API_KEY` needed by Tavily is declared in the `script` function call.
Also make sure to add it to your `.env` file.

```js 'secrets: ["TAVILY_API_KEY"],'
script({
    secrets: ["TAVILY_API_KEY"],
})
```

The `tavilySearch` function is imported using a dynamic [import](/genaiscript/reference/scripts/imports).

```ts
const { tavilySearch } = await import("./tavily.mts")
const { answer } = await tavilySearch(question.text)
```

The full source looks like this:

<Code code={scriptCode} wrap={true} lang="ts" title="document-augmentor.genai.mts" />
