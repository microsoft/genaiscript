Analyse et formatage des données `.ini`.

## `INI`

De manière similaire à la classe `JSON` en JavaScript, la classe `INI` fournit des méthodes pour analyser et formater les [fichiers `.ini`](https://en.wikipedia.org/wiki/INI_file).

```js
const fields = INI.parse(`...`)
const txt = INI.string(obj)
```

## `parsers`

Les [parsers](../../../reference/reference/scripts/parsers/) fournissent également un analyseur tolérant pour les fichiers `.env`. Retourne `undefined` pour les entrées non valides.

```js
const fields = parsers.INI(env.files[0])
```