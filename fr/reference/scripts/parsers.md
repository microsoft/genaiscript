L'objet `parsers` fournit divers analyseurs pour les formats de données communs.

## JSON5

La fonction `parsers.json5` analyse le format JSON5.
[JSON5](https://json5.org/) est une extension du format de fichier JSON populaire, visant à être plus facile à écrire et à maintenir manuellement (par exemple, pour les fichiers de configuration).

En général, analyser un fichier JSON comme JSON5 ne cause pas de problème, mais cela peut être plus tolérant aux erreurs de syntaxe. En plus de JSON5, une [réparation JSON](https://www.npmjs.com/package/jsonrepair) est appliquée si l'analyse initiale échoue.

* Exemple de JSON5

```json5
{
    // comments
    unquoted: "and you can quote me on that",
    singleQuotes: 'I can use "double quotes" here',
    lineBreaks: "Look, Mom! \
No \\n's!",
    hexadecimal: 0xdecaf,
    leadingDecimalPoint: 0.8675309,
    andTrailing: 8675309,
    positiveSign: +1,
    trailingComma: "in objects",
    andIn: ["arrays"],
    backwardsCompatible: "with JSON",
}
```

Pour analyser, utilisez `parsers.JSON5`. Cela prend en charge à la fois un contenu texte ou un fichier comme entrée.

```js
const res = parsers.JSON5("...")
```

## YAML

La fonction `parsers.YAML` analyse le [format YAML](../../../reference/reference/scripts/yaml/). YAML est plus convivial pour le tokenizer LLM que JSON et est couramment utilisé dans les fichiers de configuration.

```yaml
fields:
    number: 1
    boolean: true
    string: foo
array:
    - 1
    - 2
```

Pour analyser, utilisez `parsers.YAML`. Cela prend en charge à la fois un contenu texte ou un fichier comme entrée.

```js
const res = parsers.YAML("...")
```

## TOML

La fonction `parsers.TOML` analyse le [format TOML](https://toml.io/). TOML est plus convivial pour le tokenizer LLM que JSON et est couramment utilisé dans les fichiers de configuration.

```toml
# This is a TOML document
title = "TOML Example"
[object]
string = "foo"
number = 1
```

Pour analyser, utilisez `parsers.TOML`. Cela prend en charge à la fois un contenu texte ou un fichier comme entrée.

```js
const res = parsers.TOML("...")
```

## JSONL

JSON**L** est un format qui stocke les objets JSON dans un format ligne par ligne. Chaque ligne est un objet JSON(5) valide (nous utilisons l'analyseur JSON5 pour une meilleure résilience aux erreurs).

```jsonl title="data.jsonl"
{"name": "Alice"}
{"name": "Bob"}
```

Vous pouvez utiliser `parsers.JSONL` pour analyser les fichiers JSONL en un tableau d'objets (`any[]`).

```js
const res = parsers.JSONL(file)
```

## [XML](../../../reference/reference/scripts/xml/)

La fonction `parsers.XML` analyse le [format XML](https://en.wikipedia.org/wiki/XML).

```js
const res = parsers.XML('<xml attr="1"><child /></xml>')
```

Les noms d'attributs sont précédés de "@\_".

```json
{
    "xml": {
        "@_attr": "1",
        "child": {}
    }
}
```

## Front matter

[Front matter](https://jekyllrb.com/docs/front-matter/) est une section de métadonnées en tête d'un fichier, généralement formatée en YAML.

```markdown
---
title: "Hello, World!"
---

...
```

Vous pouvez utiliser le `parsers.frontmatter` ou [MD](../../../reference/reference/scripts/md/) pour extraire les métadonnées dans un objet.

```js
const meta = parsers.frontmatter(file)
```

## [CSV](../../../reference/reference/scripts/csv/)

La fonction `parsers.CSV` analyse le [format CSV](https://en.wikipedia.org/wiki/Comma-separated_values). Si l'analyse réussit, la fonction renvoie un tableau d'objets où chaque objet représente une ligne du fichier CSV.

```js
const res = parsers.CSV("...")
```

Les analyseurs détecteront automatiquement les noms d'en-tête s'ils sont présents ; sinon, vous devez fournir un tableau de noms d'en-tête dans les options.

```js
const res = parsers.CSV("...", { delimiter: "\t", headers: ["name", "age"] })
```

## [PDF](../../../reference/reference/scripts/pdf/)

La fonction `parsers.PDF` lit un fichier PDF et tente de le convertir proprement en un format texte. Lisez la documentation [/genaiscript/reference/scripts/pdf](../../../reference/reference/scripts/pdf/) pour plus d'informations.

## [DOCX](../../../reference/reference/scripts/docx/)

La fonction `parsers.DOCX` lit un fichier .docx comme texte brut.

## [INI](../../../reference/reference/scripts/ini/)

La fonction `parsers.INI` analyse les fichiers [.ini](https://en.wikipedia.org/wiki/INI_file), généralement utilisés pour les fichiers de configuration. Ce format est similaire au format `clé=valeur`.

```txt
KEY=VALUE
```

## [XLSX](../../../reference/reference/scripts/xlsx/)

La fonction `parsers.XLSX` lit un fichier .xlsx et renvoie un tableau d'objets où chaque objet représente une ligne de la feuille de calcul. La première ligne est utilisée comme en-têtes. La fonction utilise la bibliothèque [xlsx](https://www.npmjs.com/package/xlsx).

```js
const sheets = await parsers.XLSX("...filename.xlsx")
const { rows } = sheets[0]
```

Par défaut, elle lit la première feuille et la première ligne comme en-têtes. Vous pouvez passer un nom de feuille de calcul et/ou une plage à traiter en tant qu'options.

```js
const res = await parsers.XLSX("...filename.xlsx", {
    sheet: "Sheet2",
    range: "A1:C10",
})
```

## VTT, SRT

La fonction `parsers.transcription` analyse les fichiers de transcription VTT ou SRT en une séquence de segments.

```js
const segments = await parsers.transcription("WEBVTT...")
```

## Décompression

Décompresse le contenu d'un fichier zip et renvoie un tableau de fichiers.

```js
const files = await parsers.unzip(env.files[0])
```

## HTML vers Texte

La fonction `parsers.HTMLToText` convertit le HTML en texte brut à l'aide de [html-to-text](https://www.npmjs.com/package/html-to-text).

```js
const text = parsers.HTMLToText(html)
```

## Prompty

[Prompty](../../../reference/reference/scripts/prompty/) est un format de modèle de prompt basé sur Markdown. GenAIScript fournit un analyseur pour les modèles prompty, avec quelques champs de métadonnées supplémentaires pour définir des tests et des exemples.

```md title="basic.prompty"
---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
---
system:
You are an AI assistant who helps people find information. Answer all questions to the best of your ability.
As the assistant, you answer questions briefly, succinctly.
user:
{{question}}
```

Pour analyser ce fichier, utilisez la fonction `parsers.prompty`.

```js
const doc = await parsers.prompty(file)
```

## Expression mathématique

La fonction `parsers.math` utilise [mathjs](https://mathjs.org/) pour analyser une expression mathématique.

```js
const res = await parsers.math("1 + 1")
```

## .env

La fonction `parsers.dotEnv` analyse les fichiers [.env](https://www.dotenv.org/), généralement utilisés pour les fichiers de configuration. Ce format est similaire au format `clé=valeur`.

```txt
KEY=VALUE
```

## fences

Analyse la sortie de LLM similaire à la sortie de la fonction genaiscript def(). Le texte attendu ressemble à ceci :

````
Foo bar:
```js
var x = 1
...
```

Baz qux:
````

Également pris en charge.
...

```
```

Renvoie une liste de sections de code analysées.

```js
const fences = parsers.fences("...")
```

## annotations

Analyse les annotations d'erreurs et d'avertissements dans divers formats en une liste d'objets.

* [GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions)
* [Azure DevOps Pipeline](https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops\&tabs=bash#example-log-a-warning-about-a-specific-place-in-a-file)
*

```js
const annotations = parsers.annotations("...")
```

## tokens

La fonction `parsers.tokens` estime le nombre de tokens dans une chaîne pour le modèle actuel. Cela est utile pour estimer le nombre d'invites pouvant être générées à partir d'une chaîne.

```js
const count = parsers.tokens("...")
```

## validateJSON

La fonction `parsers.validateJSON` valide une chaîne JSON par rapport à un schéma.

```js
const validation = parsers.validateJSON(schema, json)
```

## mustache

Exécute le moteur de modèle [mustache](https://mustache.github.io/) dans la chaîne et les arguments.

```js
const rendered = parsers.mustache("Today is {{date}}.", { date: new Date() })
```

## jinja

Exécute le modèle [jinja](https://jinja.palletsprojects.com/en/3.1.x/) (en utilisant [@huggingface/jinja](https://www.npmjs.com/package/@huggingface/jinja)).

```js
const rendered = parsers.jinja("Today is {{date}}.", { date: new Date() })
```

## tidyData

Un ensemble d'options de manipulation de données utilisées en interne avec `defData`.

```js
const d = parsers.tidyData(rows, { sliceSample: 100, sort: "name" })
```

## GROQ

Applique une requête [GROQ](https://groq.dev/) sur un objet JSON.

```js
const d = parsers.GROQ(
    `*[completed == true && userId == 2]{
  title
}`,
    data
)
```

## hachage

Utilitaire pour hacher un objet ou un tableau en une chaîne adaptée aux fins de hachage.

```js
const h = parsers.hash({ obj, other }, { length: 12 })
```

Par défaut, utilise `sha-1`, mais `sha-256` peut également être utilisé. La logique de conditionnement du hachage peut changer entre les versions de genaiscript.

## désenseigner

Certains modèles renvoient leur raisonnement interne à l'intérieur des balises \`

```markdown
<think>This is my reasoning...</think>
Yes
```

La fonction `unthink` supprime les balises \`

```js
const text = parsers.unthink(res.text)
```

## Ligne de commande

Utilisez la commande [parse](../../../reference/reference/cli/commands#parse/) depuis la CLI pour essayer différents analyseurs.

```sh
# convert any known data format to JSON
genaiscript parse data mydata.csv
```