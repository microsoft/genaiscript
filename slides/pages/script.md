---
layout: two-cols-header
---

# Anatomy of a Script

Analyze a PDF file and extract data to schematized JSON file.

::left::


<v-click>

```js
// context
const file = def("FILE", env.files, { endsWith: ".pdf" })
```

</v-click>

<v-click>

```js
// task
$`Analyze ${file} and extract data.`
```

</v-click>

<v-click>

```js
// output
$`Save data to '<file>.json' where <file> is the filename.`
```

</v-click>

<v-click>

```js
// schemas
const schema = defSchema("DATA", [{ name: "name", value: 1 }])
```

</v-click>

<v-click>

```js
// structured output
$`Format results as JSON using the ${schema} schema.`
```

</v-click>

<v-click>

```js
// tools, agents
defTool("read_file", "reads a file", ({ filename }) => {
    return workspace.readText(filename)
})
```

</v-click>

::right::

# 

<v-click at="1">

````markdown
FILE: "example.pdf"
Lorem ipsum...
````

</v-click>

<v-click at="2">

````markdown
Analyze FILE and extract data.
````

</v-click>

<v-click at="3">

````markdown

Save data to '<file>.json' where <file> is the filename.
````

</v-click>

<v-click at="4">

```markdown

SCHEMA:
type DATA = Array<{ name: string; value: number }>
```

</v-click>

<v-click at="5">

```markdown
Format results as JSON using the DATA schema.
```


</v-click>

<v-click at="6">

```json
{ ..., "tools": [{
        "name": "read_file",
        "description": "reads a file",
        "parameters": [{
            "name": "filename"
        }],
        "returns": "string"
    }], ...}
```


</v-click>