Vous pouvez définir des **alias de modèles** dans votre projet pour donner des noms conviviaux aux modèles et les abstraire d'une version/étiquette spécifique de modèle.

Ainsi, au lieu de coder en dur un type de modèle,

```js 'model: "openai:gpt-4o"'
script({
    model: "openai:gpt-4o",
})
```

Vous pouvez utiliser/définir un alias comme `large`.

```js 'model: "large"'
script({
    model: "large",
})
```

Les alias de modèles peuvent être définis comme des variables d'environnement (via le fichier `.env`), dans un fichier de configuration, via le [cli](../../../reference/reference/cli/run/) ou dans la fonction `script`.

Ce fichier `.env` définit un alias `llama32` pour le modèle `ollama:llama3.2:1b`.

```txt title=".env"
GENAISCRIPT_MODEL_LLAMA32="ollama:llama3.2:1b"
```

Vous pouvez alors utiliser l'alias `llama32` dans vos scripts.

```js 'model: "llama32"'
script({
    model: "llama32",
})
```

## Définir des alias

Les configurations suivantes sont prises en charge par ordre d'importance (le dernier l'emporte) :

* [fichier de configuration](../../../reference/reference/configuration-files/) avec le champ `modelAliases`

```json title="genaiscript.config.json"
{
    "modelAliases": {
        "llama32": "ollama:llama3.2:1b"
    }
}
```

* variables d'environnement avec des clés du pattern `GENAISCRIPT_MODEL_ALIAS=...`
* [cli](../../../reference/reference/cli/run/) avec l'option `--model-alias`

```sh
genaiscript run --model-alias llama32=ollama:llama3.2:1b
```

* dans la fonction `script`

```js
script({
    model: "llama32",
    modelAliases: {
        llama32: "ollama:llama3.2:1b",
    },
})
```

## Alias d'alias

Un alias de modèle peut référencer un autre alias à condition de ne pas créer de cycles.

```json title="genaiscript.config.json"
{
    "modelAliases": {
        "llama32": "ollama:llama3.2:1b",
        "llama": "llama32"
    }
}
```

## Alias intégrés

Par défaut, GenAIScript prend en charge les alias de modèles suivants, ainsi que divers candidats chez différents fournisseurs de LLM.

* `large` : modèle de type `gpt-4o`
* `small` : modèle `gpt-4o-mini` ou similaire. Un modèle plus petit, moins cher et plus rapide
* `vision` : `gpt-4o-mini`. Un modèle capable d'analyser des images
* `reasoning` : `o1` ou `o1-preview`.
* `reasoning_small` : `o1-mini`.

Les alias suivants sont également définis pour que vous puissiez remplacer les LLM utilisés par GenAIScript lui-même.

* `agent` : `large`. Modèle utilisé par l'Agent LLM.
* `memory` : `small`. Modèle utilisé par la mémoire à court terme de l'agent.

Les alias par défaut pour un fournisseur donné peuvent être chargés en utilisant l'option `provider` dans le [cli](../../../reference/reference/cli/run/).

```sh
genaiscript run --provider anthropic
```