---
# try also 'default' to start simple
theme: default
title: GenAIScript
titleTemplate: "%s"
#colorSchema: dark
favicon: "https://microsoft.github.io/genaiscript/images/favicon.svg"
info: |
    ## AST-based LLM Edits
    with GenAIScript.<br/>
    [Docs](https://microsoft.github.io/genaiscript/) | [GitHub](https://github.com/microsoft/genaiscript/)
class: text-center
# https://sli.dev/custom/highlighters.html
highlighter: shiki
# https://sli.dev/guide/drawing
drawings:
    persist: false
# slide transition: https://sli.dev/guide/animations#slide-transitions
#transition: slide-left
# enable MDC Syntax: https://sli.dev/guide/syntax#mdc-syntax
mdc: true
layout: center
---

![](https://ast-grep.github.io/logo.svg){ style="width: 16rem; margin:auto; margin-right: 1rem; display:inline;" }
![](https://microsoft.github.io/genaiscript/images/favicon.svg){ style="width: 12rem; margin:auto; display:inline;" }

# AST-based LLM Edits

## with ast-grep and GenAIScript

<br/>
<br/>

https://microsoft.github.io/genaiscript/blog/ast-grep-and-transform/

---
layout: center
---

# AST-based search and replace

# powered LLM transforms

- compiler precision/scale for search/insert
- LLM reasoning for text generation

_best of both worlds!_

---
layout: center
---

# Examples

## Upsert comments `/docs`

- Insert new comments
- Update existing comments
- DO NOT MODIFY MY CODE!

## Upsert tests `/tests`

- Find existing tests, and updates
- Generate new tests
- DO NOT MODIFY MY CODE!

## Upsert logging instrumentation (AOP)

- Find every branch and insert logging statement
- DO NOT MODIFY MY CODE ANYWHERE ELSE!

---

# AST-GREP

## ast-grep(sg) is a fast and polyglot tool for code structural search, lint, rewriting at large scale.

- pattern matching over tree-sitter ASTs

![AST-GREP playground](/ast-grep.png)

- https://ast-grep.github.io/

---
layout: two-cols-header
---

# AST-GREP x GenAIScript

::left::

- Match and replace AST nodes with native node.js library
- Fast and efficient
- Polyglot (C, C++, Java, Python, Go, Ruby, Rust, TypeScript, JavaScript, any tree-sitter grammar...)

::right::

```js
// search
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
// update
const edits = sg.changeset()
for (const match of matches) {
    const edit = match.replace(/* LLM generates */)
    edits.insert(edit)
}
// commit
const newFiles = edits.commit()
await workspace.writeFiles(newFiles)
```

---
layout: center
---

# AST-based search and replace

# powered LLM transforms

- compiler precision/scale for search/insert
- LLM reasoning for text generation

_best of both worlds!_

---

# Docs generator for TypeScript `/docs`

```
find functions without docs
  generate docs
  update file
find functions with docs
  update docs
  use LLM-as-judge to weed out nits
  update file
```

- [source](https://github.com/microsoft/genaiscript/blob/main/genaisrc/docs.genai.mts)
- [applied to TypeScript ](https://github.com/pelikhan/TypeScript/commit/0c90af56cd533a545257f332b883597e2c07f1b8)
- [github action](https://github.com/microsoft/genaiscript/blob/dev/.github/workflows/genai-docs.yml)

![alt text](/docs-diff.png)

---
layout: two-cols-header
---

# Debug statement instrumentation

::left::

```
branches = find all branches without debug statements
  insert unique identifier in each branch
ask LLM to generate debug statement all at once
parse out the debug statements
  insert debug statements in each branch
save file
```

- **2 LLM requests per file**, LLM only regenerates debug statements
- [source](https://github.com/microsoft/genaiscript/blob/main/genaisrc/debugify.genai.mts)

::right::

- original

```js
if (condition) {
  ...
}
```

- marked

```js
if (condition) {
  dbg(<DBG_ID_1>);
  ...
}
```

- LLM response

```txt
DBG_ID_1: reason
```

- updated

```js
if (condition) {
  dbg("...describe why we took the branch...");
  ...
}
```
