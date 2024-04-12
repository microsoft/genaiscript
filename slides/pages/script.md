
# Context x Script = Prompt

- **It Is Just JavaScript(TM)** with `.d.ts` for dev experience
- `$...` writes to the prompt
- builtin parsers and utilities missing in vanilla JS
- context in `env` (selected files in `env.files`, cli variables in `env.vars`)

```js
// define the context
const file = def("FILE", env.files, { endsWith: ".pdf" })
// define data structure
const schema = defSchema("DATA", 
    { type: "array", items: { type: "string" } })
// assign the task
$`Analyze ${file} and extract data to JSON using the ${schema} schema.`
```

<br/>

````txt
FILE lorem.pdf:
Lorem Ipsum ...

DATA:
type Data = string[]

Analyze FILE and extract data to JSON using the DATA schema.
````