import { Code } from "@astrojs/starlight/components"
import schema from "../../../../../public/schemas/config.json?raw";

GenAIScript prend en charge les fichiers de configuration locaux et globaux pour permettre la réutilisation des paramètres de configuration courants et des secrets entre plusieurs scripts.

## Résolution des fichiers .env

GenAIScript va scanner et charger les fichiers `.env` suivants dans l’ordre suivant :

* Propriété `envFile` dans les fichiers de configuration (voir ci-dessous)
* Variable d’environnement `GENAISCRIPT_ENV_FILE`
* Options de ligne de commande `--env`

```sh
genaiscript run ... --env ./.env.debug --env ~/.env.dev
```

Si aucune des options ci-dessus n’est définie, il essaiera de charger les fichiers suivants :

* `~/.env`
* `./.env`
* `./.env.genaiscript`

### Résolution des fichiers de configuration

GenAIScript va scanner les fichiers de configuration suivants
et fusionner leur contenu dans la configuration finale.

* `~/genaiscript.config.yaml`
* `~/genaiscript.config.json`
* `./genaiscript.config.yaml`
* `./genaiscript.config.json`

Les fichiers JSON supportent le format [JSON5](https://json5.org/) (y compris les commentaires, les virgules finales, etc.).

## Schéma

Le schéma de configuration est disponible à l’adresse [https://microsoft.github.io/genaiscript/schemas/config.json](https://microsoft.github.io/genaiscript/schemas/config.json).

<Code code={schema} wrap={true} lang="json" />

## Propriété `envFile`

L’emplacement final de `envFile` sera utilisé pour charger le secret dans les variables d’environnement. Elle supporte un seul fichier.

## Propriété `include`

La propriété `include` vous permet de fournir des chemins globaux pour inclure davantage de scripts.
Combinée à un fichier de configuration global, cela permet de partager des scripts entre plusieurs projets.

```yaml title="genaiscript.config.yaml"
include:
    - "globalpath/*.genai.mjs"
```

## Propriété `modelAliases`

La propriété `modelAliases` vous permet de définir des alias pour les noms de modèles.

```js
{
    "modelAliases": {
        "llama32": "ollama:llama3.2:1b",
        "llama32hot": {
            "model": "ollama:llama3.2:1b",
            "temperature": 2
        }
    }
}
```

## Propriété `modelEncodings`

La propriété `modelEncodings` vous permet de définir l’encodage pour le modèle.

```js
{
    "modelEncodings": {
        "azure:gpt__4o_random_name": "gpt-4o"
    }
}
```

## Débogage

Activez la catégorie de débogage `config` pour voir des informations supplémentaires sur la résolution de la configuration.

Vous pouvez également activer d’autres catégories de débogage pour obtenir des journaux plus détaillés.

```sh
DEBUG=config genaiscript run ...
```