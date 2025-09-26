import { Image } from "astro:assets"
import logoPng from "../../../../../assets/mcp.png";
import logoPngTxt from "../../../../../assets/mcp.png.txt?raw";

<Image src={logoPng} alt={logoPngTxt} />

Le [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) définit un protocole permettant de partager des [outils](https://modelcontextprotocol.io/docs/concepts/tools) et de les utiliser quel que soit le framework ou l'environnement d'exécution sous-jacent.

**GenAIScript implémente un serveur qui transforme des scripts en outils MCP**.

:::tip
GenAIScript implémente également un client pour les outils MCP, qui vous permet de consommer des outils MCP dans un script.
Voir [outils MCP](../../../reference/reference/scripts/mcp-tools/) pour plus de détails.
:::

## Scripts comme outils MCP

GenAIScript lance un serveur MCP qui expose chaque script GenAIScript comme un outil MCP (à ne pas confondre avec `defTool`).

La description de l'outil MCP correspond à la description du script.
**Assurez-vous de bien élaborer la description**, car c'est ainsi que le LLM décide quel outil utiliser lors de l'exécution d'un script. Si votre outil n'est pas sélectionné par le LLM, c'est probablement un problème de description.

Les paramètres de l'outil MCP sont déduits automatiquement à partir des [paramètres de script](../../../reference/reference/scripts/parameters/) et des fichiers.
Les paramètres MCP rempliront alors l'objet `env.vars` dans le script comme d'habitude.

La sortie de l'outil MCP correspond à la sortie du script. C'est-à-dire, typiquement, le dernier message de l'assistant pour un script qui utilise le contexte de haut niveau.
Ou tout contenu passé dans [env.output](../../../reference/reference/scripts/output-builder/).

Voyons un exemple. Voici un script `task.genai.mjs` qui prend en entrée un paramètre `task`, construit une invite, et renvoie la sortie du LLM.

```js title="task.genai.mjs"
script({
    description: "You MUST provide a description!",
    parameters: {
        task: {
            type: "string",
            description: "The task to perform",
            required: true
        }
    }
})

const { task } = env.vars // extract the task parameter

... // genaiscript logic
$`... prompt ... ${task}` // output the result
```

Un script plus avancé pourrait ne pas utiliser le contexte de niveau supérieur et utiliser à la place `env.output` pour transmettre le résultat.

```js title="task.genai.mjs"
script({
    description: "You MUST provide a description!",
    accept: "none", // this script does not use 'env.files'
    parameters: {
        task: {
            type: "string",
            description: "The task to perform",
            required: true
        }
    }
})

const { output } = env // store the output builder
const { task } = env.vars // extract the task parameter

... // genaiscript logic with inline prompts
const res = runPrompt(_ => `... prompt ... ${task}`) // run some inner the prompt
...

// build the output
output.fence(`The result is ${res.text}`)
```

### Annotations

[Les annotations d'outils](https://modelcontextprotocol.io/docs/concepts/tools#tool-annotations) fournissent des métadonnées supplémentaires sur le comportement d’un outil,
aidant les clients à comprendre comment présenter et gérer les outils. Ces annotations sont des indications qui décrivent la nature et l'impact d'un outil, mais ne doivent pas être utilisées pour des décisions de sécurité.

```js "annotations"
script({
    ...,
    annotations: {
        readOnlyHint: true,
        openWorldHint: true,
    },
})
```

* `title` est renseigné à partir du titre du script.
* `readOnlyHint` : `boolean`, défaut : `false`\
  Si vrai, indique que l'outil ne modifie pas son environnement.
* `destructiveHint` : `boolean`, défaut : `true`\
  Si vrai, l'outil peut effectuer des mises à jour destructives (ceci n’est significatif que lorsque `readOnlyHint` est faux).
* `idempotentHint` : `boolean`, défaut : `false`\
  Si vrai, appeler l'outil à plusieurs reprises avec les mêmes arguments n'a pas d'effet supplémentaire (ceci n’est significatif que lorsque `readOnlyHint` est faux).
* `openWorldHint` : `boolean`, défaut : `true`\
  Si vrai, l'outil peut interagir avec un “monde ouvert” d’entités externes.

## Ressources

[Les ressources](https://modelcontextprotocol.io/docs/concepts/resources) sont une primitive centrale dans le Protocole de Contexte Modèle (MCP) qui permet aux serveurs d'exposer des données
et du contenu qui peuvent être lus par les clients et utilisés comme contexte pour les interactions LLM.

Dans GenAIScript, vous pouvez créer une ressource en utilisant `host.publishResource` et elle sera automatiquement exposée en tant que ressource MCP.

```js title="task.genai.mjs"
const id = await host.publishResource("important data", file)
```

La valeur de retour est l'URI de la ressource, qui peut être utilisée dans le résultat de l'invite.
`publishResource` prend en charge les fichiers, les buffers et les chaînes de caractères.

La ressource sera disponible pendant toute la durée de vie du serveur MCP.

### Images

En utilisant `env.output.image`, un script peut produire des images qui feront partie de la réponse de l'outil.

```js
await env.output.image("...filename.png")
```

### Analyse de secrets

GenAIScript dispose d'une [fonctionnalité intégrée d'analyse de secrets](../../../reference/reference/scripts/secret-scanning/)
qui analysera vos ressources pour détecter des secrets. Pour désactiver cette fonctionnalité,
vous pouvez définir l'option `secretScanning` sur `false` dans `publishResource`.

```js
const id = await host.publishResource("important data", file, {
    secretScanning: false,
})
```

## Script de démarrage

Vous pouvez spécifier un identifiant de script de démarrage dans la ligne de commande avec l’option `--startup`.
Il sera exécuté après le démarrage du serveur.

```sh
genaiscript mcp --startup load-resources
```

Vous pouvez utiliser ce script pour charger des ressources ou effectuer toute autre configuration nécessaire.

## Configuration de l'IDE

La commande `mcp` lance le serveur MCP en utilisant le transport stdio.

* [@modelcontextprotocol/inspector](https://www.npmjs.com/package/@modelcontextprotocol/inspector)
  est un client MCP qui peut être utilisé pour inspecter le serveur et lister les outils disponibles.

```sh
npx --yes @modelcontextprotocol/inspector npx --yes genaiscript mcp
```

### Visual Studio Code Insiders avec GitHub Copilot Chat

Vous aurez besoin de Visual Studio Code v1.99 ou supérieur et de l'extension [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) installée.

```json title=".vscode/mcp.json"
{
    "servers": {
        "genaiscript": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "genaiscript", "mcp", "--cwd", "${workspaceFolder}"],
            "envFile": "${workspaceFolder}/.env"
        }
    }
}
```

### Claude Desktop

```json
{
    "mcpServers": {
        "genaiscript": {
            "command": "npx",
            "args": ["-y", "genaiscript", "mcp"]
        }
    }
}
```

### Filtrage des scripts

Si vous devez filtrer les scripts exposés en tant qu'outils MCP, vous pouvez utiliser l'option `--groups` et définir le groupe `mcp` dans vos scripts.

```js 'group: "mcp"'
script({
    group: "mcp",
})
```

```json title=".vscode/mcp.json" ', "--groups", "mcp"'
{
    "servers": {
        "genaiscript": {
            "type": "stdio",
            "command": "npx",
            "args": [
                "-y",
                "genaiscript",
                "mcp",
                "--cwd",
                "${workspaceFolder}",
                "--groups",
                "mcp"
            ],
            "envFile": "${workspaceFolder}/.env"
        }
    }
}
```

## Exécution de scripts depuis un dépôt distant

Vous pouvez utiliser l’option `--remote` pour charger des scripts depuis un dépôt distant.
GenAIScript effectuera un clonage superficiel (shallow clone) du dépôt et exécutera le script depuis le dossier cloné.

```sh
npx --yes genaiscript mcp --remote https://github.com/...
```

Il existe des flags additionnels pour contrôler le clonage du dépôt :

* `--remote-branch <branch>` : La branche à cloner depuis le dépôt distant.
* `--remote-force` : Force le clonage même si le dossier cloné existe déjà.
* `--remote-install` : Installe les dépendances après le clonage du dépôt.

:::caution
Comme toujours, soyez prudent lorsque vous exécutez des scripts provenant d’un dépôt distant.
Assurez-vous de faire confiance à la source avant d’exécuter le script et envisagez de verrouiller sur un commit spécifique.
:::