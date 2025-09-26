[YAML](https://yaml.org/) est un format de sérialisation de données lisible par l'homme, couramment utilisé pour les fichiers de configuration et l'échange de données.

Dans le contexte de LLM, YAML est plus convivial pour l'algorithme du tokenizer et est généralement préféré à JSON pour représenter des données structurées.

## `defData`

La fonction `defData` convertit un objet en YAML dans l'invite (et d'autres formats si nécessaire).

```js
defData("DATA", data)
```

## `YAML`

De la même manière que la classe `JSON` en JavaScript, la classe `YAML` dans LLM fournit des méthodes pour analyser et convertir en chaîne des données YAML.

```js
const obj = YAML`value: ${x}`
const obj = YAML.parse(`...`)
const str = YAML.stringify(obj)
```

## `parsers`

Les [parsers](../../../reference/reference/scripts/parsers/) fournissent également un analyseur tolérant pour YAML.
Il renvoie `undefined` pour les entrées invalides.

```js
const res = parsers.YAML("...")
```

## Schémas

Les schémas JSON définis avec [defSchema](../../../reference/reference/scripts/schemas/) peuvent également être utilisés pour valider les données YAML.