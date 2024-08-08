
# Generative AI Scripting
Build your own LLM-powered tools.

<v-click>

```js
const file = def("FILE", env.files, { endsWith: ".pdf" }) // context
const schema = defSchema("DATA", // schema
    { type: "array", items: { type: "string" } })
$`Analyze ${file} and extract data to JSON using the ${schema} schema.` // task
$`Save data to ${file}.json.` // output
```

</v-click>

<v-click>

- **`$...`** writes to the prompt, **`def`** defines a "variable", `defSchema` defines a schema
- **It Is Just JavaScript(TM)** (also TypeScript)

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

<v-click>

- Builtin parsers (PDF, XML, ...), file extraction (save/edit), structured output
- Fast dev loop in Visual Studio Code 
- Automation with Command Line (GitHub Actions, Azure DevOps)

</v-click>