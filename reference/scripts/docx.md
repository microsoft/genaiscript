
The `def` function will automatically parse DOCX files and extract text from them:

```javascript
def("DOCS", env.files, { endsWith: ".docx" })
```

## Parsers

The `parsers.DOCX` function reads a DOCX file and attempts to cleanly convert it into a text format
that is friendly to the LLM.

```js
const { file } = await parsers.DOCX(env.files[0])

def("FILE", file)
```
