
# Generative AI Scripting
Generate a LLM prompt by executing a JS script.

<v-click>

```js
// define the context
const file = def("FILE", env.files, { endsWith: ".pdf" })
// define data structure
const schema = defSchema("DATA", 
    { type: "array", items: { type: "string" } })
// assign the task
$`Analyze ${file} and extract data to JSON using the ${schema} schema.`
```

</v-click>

<v-click>

- **It Is Just JavaScript(TM)** (also TypeScript)
- **`$...`** writes to the prompt, **`def`** defines a "variable" + various builtin parsers and utilities
- Fast development loop in Visual Studio Code + Automation with Command Line

</v-click>


<v-click>

````txt
FILE lorem.pdf:
Lorem Ipsum ...

DATA:
type Data = string[]

Analyze FILE and extract data to JSON using the DATA schema.
````

</v-click>