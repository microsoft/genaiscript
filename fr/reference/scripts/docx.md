La fonction `def` analysera automatiquement les fichiers DOCX et en extraira le texte :

```javascript
def("DOCS", env.files, { endsWith: ".docx" })
```

## Analyseurs

La fonction `parsers.DOCX` lit un fichier DOCX et tente de le convertir proprement en un format texte adapté au LLM.

```js
const { file } = await parsers.DOCX(env.files[0])

def("FILE", file)
```