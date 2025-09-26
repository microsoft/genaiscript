La fonction `def` analysera automatiquement les fichiers PDF et en extraira le texte. Cela est utile pour générer des invites à partir de fichiers PDF.

```javascript
def("DOCS", env.files) // contains some pdfs
def("PDFS", env.files, { endsWith: ".pdf" }) // only pdfs
```

## Analyseurs

La fonction `parsers.PDF` lit un fichier PDF et tente de le convertir proprement en un format texte adapté aux LLM.

```js
const { file, pages } = await parsers.PDF(env.files[0])
```

Une fois analysés, vous pouvez utiliser les variables `file` et `pages` pour générer des invites. Si l'analyse échoue, la variable `file` sera `undefined`.

```js
const { file, pages } = await parsers.PDF(env.files[0])

// inline the entire file
def("FILE", file)

// or analyze page per page, filter pages
pages.slice(0, 2).forEach((page, i) => {
    def(`PAGE_${i}`, page)
})
```

## Images et figures

GenAIScript extrait automatiquement les images bitmap des fichiers PDF et les stocke dans le tableau de données. Vous pouvez utiliser ces images pour générer des invites. Les images sont encodées en PNG et peuvent être volumineuses.

```js
const { data } = await parsers.PDF(env.files[0])
```

## Rendre les pages en images

Ajoutez l'option `renderAsImage` pour convertir également chaque page en une image PNG (sous forme de buffer). Ce buffer peut être utilisé avec un modèle de vision pour effectuer une opération OCR.

```js wrap
const { images } = await parsers.PDF(env.files[0], { renderAsImage: true })
```

Vous pouvez contrôler la qualité de l'image rendue à l'aide du paramètre `scale` (par défaut, 3).

## Les fichiers PDF sont complexes

Le format PDF n'a jamais vraiment été conçu pour permettre une extraction de texte propre. La fonction `parsers.PDF` utilise le paquet `pdf-parse` pour extraire le texte des fichiers PDF. Ce paquet n'est pas parfait et peut ne pas réussir à extraire du texte de certains PDF. Si vous avez accès au document original, il est recommandé d'utiliser un format plus adapté au texte tel que Markdown ou un fichier texte brut.