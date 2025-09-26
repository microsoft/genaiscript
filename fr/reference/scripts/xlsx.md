Analyse et conversion en chaîne des fichiers de tableur Excel, xlsx.

## `parsers`

Les [parsers](../../../reference/reference/scripts/parsers/) fournissent également un analyseur polyvalent pour XLSX. Il renvoie un tableau de feuilles (`name`, `rows`) où chaque ligne est un tableau d'objets.

```js
const sheets = await parsers.XLSX(env.files[0])
```