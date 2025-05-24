[ast-grep](https://ast-grep.github.io/) is a fast and polyglot tool for code structural search, lint, rewriting at large scale.

GenAIScript provides a wrapper around `ast-grep` to search for patterns in the AST of a script,
and transform the AST! This is a very efficient way to create scripts that modify source code as one is able
to surgically target specific parts of the code.

- load the `ast-grep` module

```ts
const sg = await host.astGrep()
```

## Search for patterns

The `search` method allows you to search for patterns in the AST of a script.
The first argument is the language, the second argument is the file globs, and the third argument is the pattern to search for.

- find all TypeScript `console.log` statements. This example uses the 'pattern' syntax.

```ts
// matches is an array of AST (immutable) nodes
const { matches } = await sg.search("ts", "src/*.ts", "console.log($META)")
```

- find all TypeScript functions without comments. This example uses the [rule syntax](https://ast-grep.github.io/reference/rule.html).

```ts
const { matches } = await sg.search("ts", "src/fib.ts", {
    rule: {
        kind: "function_declaration",
        not: {
            precedes: {
                kind: "comment",
                stopBy: "neighbor",
            },
        },
    },
})
```

or if you copy the rules from the [ast-grep playground](https://ast-grep.github.io/playground.html) using YAML,

```ts
const { matches } = await sg.search(
    "ts",
    "src/fib.ts",
    YAML`
rule:
    kind: function_declaration
    not:
        precedes: 
            kind: comment
            stopBy: neighbor
`
)
```

:::tip

Use the [ast-grep playground](https://ast-grep.github.io/playground.html) to debug your queries,
then copy them back into your GenAIScript script.

:::

### Filter by diff

A common use case is to restrict the pattern to code impacted by a code diff.
You can pass a `diff` string to the `search` method and it will filter out matches
that do not intersect with the `to` files of the diff.

```ts "{ diff }" wrap
const diff = await git.diff({ base: "main" })
const { matches } = await sg.search("ts", "src/fib.ts", {...}, { diff })
```

## Changesets

A common use case is to search for a pattern and replace it with another pattern. The transformation phase can leverage
[inline prompts](/genaiscript/reference/scripts/inline-prompts) to perform LLM transformations.
This can be done with the `replace` method.

```js
const edits = sg.changeset()
```

The `replace` method creates an edit that replaces the content of a node with new text.
The edit is stored internally but not applied until `commit` is called.

```js
edits.replace(matches[0], "console.log('replaced')")
```

Of course, things get more interesting when you use inline prompts to generate the replacement text.

```js wrap
for(const match of matches) {
  const updated = await prompt`... ${match.text()} ...`
  edits.replace(
    match.node,
    `console.log
  ('${updated.text}')`)
}
```

Next, you can commit the edits to create a set of in-memory files. The changes are not applied
to the file system yet.

```js
const newFiles = edits.commit()
```

If you wish to apply the changes to the file system, you can use the `writeFiles` function.

```js
await workspace.writeFiles(newFiles)
```

:::caution

Do not mix matches from different searches in the same changeset.

:::

## Supported languages

This version of `ast-grep` [supports the following built-in languages](https://ast-grep.github.io/reference/api.html#supported-languages):

- Html
- JavaScript
- TypeScript
- Tsx
- Css
- C
- C++
- Python
- C#

The following languages require installing an additional package ([full list](https://www.npmjs.com/search?q=keywords:ast-grep-lang)):

- SQL, `@ast-grep/lang-sql`
- Angular, `@ast-grep/lang-angular`

```sh
npm install -D @ast-grep/lang-sql
```

:::tip

If your language is not supported, go to [ast-grep langs](https://github.com/ast-grep/langs/issues), and add a request!

:::

### Filename extension mapping

The following file extensions are mapped to the corresponding languages:

- HTML: `html`, `htm`
- JavaScript: `cjs`, `mjs`, `js`
- TypeScript: `cts`, `mts`, `ts`
- TSX: `tsx`
- CSS: `css`
- c: `c`
- cpp: `cpp`, `cxx`, `h`, `hpp`, `hxx`
- python: `py`
- C#: `cs`
- sql: `sql`

### Overriding the language selection

GenAIScript has default mappings from well-known file extensions to languages.
However, you can override this by passing the `lang` option to the `search` method.

```ts "{ lang: "ts" }"
const { matches } = await sg.search("ts", "src/fib.ts", {...}, { lang: "ts" })
```

## Learning ast-grep

There is a learning curve to grasp the query language of `ast-grep`.

- the [official documentation](https://ast-grep.github.io/docs/) is a good place to start.
- the [online playground](https://ast-grep.github.io/playground.html) allows you to experiment with the tool without installing it.
- the [JavaScript API](https://ast-grep.github.io/guide/api-usage/js-api.html#inspection) which helps you understand how to work with nodes
- download [llms.txt](https://ast-grep.github.io/llms-full.txt) into to your Copilot context for best results.

:::tip

GenAIScript provides a simplified set of interfaces to interact with the `ast-grep` [JavaScript apis](https://ast-grep.github.io/guide/api-usage/js-api.html).
However, they are indeed the native `ast-grep` APIs, and you can use them directly if you need more control.

:::

## Logging

You can enable the `genaiscript:astgrep` namespace to see the queries and results in the logs.

```sh
DEBUG=genaiscript:astgrep ...
```