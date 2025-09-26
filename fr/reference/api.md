import { Tabs, TabItem } from "@astrojs/starlight/components"
import { PackageManagers } from "starlight-package-managers"

GenAIScript s'exécute dans un environnement Node.JS (légèrement modifié) où des variables globales supplémentaires ont été ajoutées.
Cet environnement est configuré par le [cli](../../../reference/reference/cli/).
Par conséquent, pour exécuter un GenAIScript dans un processus Node.JS "vanilla", vous devrez utiliser
**l’API `run` de Node.JS**. Cette API charge et exécute un script GenAIScript dans un thread worker séparé.

Cette page décrit comment importer et utiliser GenAIScript comme une API dans votre application Node.JS.

## Configuration

En supposant que vous ayez ajouté le cli comme dépendance dans votre projet,
vous pouvez importer le [cli](../../../reference/reference/api/) de la manière suivante :

<PackageManagers pkg="genaiscript" dev />

## Utilisation

L’API peut être importée via des imports depuis **"genaiscript/api"**.

```js wrap
import { run } from "@genaiscript/api"
```

Le wrapper `api.mjs` importé est un chargeur très léger, sans dépendance,
qui crée un [thread worker Node.JS](https://nodejs.org/api/worker_threads.html) pour exécuter GenAIScript.

* Pas de pollution des variables globales
* Pas d’effets secondaires sur le processus

## `run`

La fonction `run` encapsule la commande [cli run](../../../reference/reference/cli/run/).

```js wrap
import { run } from "@genaiscript/api"

const results = await run("summarize", ["myfile.txt"])
```

### Variables d’environnement

Vous pouvez définir les variables d’environnement pour le processus GenAIScript en passant un objet via le champ `env` dans les options. Par défaut, le worker héritera de `process.env`.

```js wrap
const results = await run("summarize", ["myfile.txt"], {
    env: {
        MY_ENV_VAR: "value",
    },
})
```