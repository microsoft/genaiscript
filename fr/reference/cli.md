import { Steps } from "@astrojs/starlight/components"
import { Tabs, TabItem } from "@astrojs/starlight/components"
import DirectoryLinks from "../../../../../components/DirectoryLinks.astro";
import GenAIScriptCli from "../../../../../components/GenAIScriptCli.astro";
import { PackageManagers } from "starlight-package-managers"

L’interface en ligne de commande GenAIScript **`genaiscript`** exécute des scripts GenAIScript
en dehors de Visual Studio et dans votre [automatisation](../../../reference/getting-started/automating-scripts/).

<GenAIScriptCli args="..." />

## Prérequis

L’interface CLI est un paquet Node.JS hébergé sur [npm](https://www.npmjs.com/package/genaiscript).

* Installez [Node.JS LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (Node.JS inclut npm et npx).

:::tip
Vous avez besoin d’au moins Node.JS v22 !
:::

## Installation

* Installez-le localement comme une `devDependency` dans votre projet.

<PackageManagers pkg="genaiscript" dev frame="none" />

* Installez-le globalement.

```sh "-g"
npm install -g genaiscript
```

* Vérifiez que votre version de node est au moins 20.\_ et npm 10.\_ en exécutant cette commande.

```sh
node -v
npx -v
```

```text
v22.16.0
10.9.2
```

## Pas d’installation (`npx`)

> `npx` est installé avec **Node.JS**.

En utilisant [npx](https://docs.npmjs.com/cli/v10/commands/npx),
vous pouvez exécuter la CLI sans aucune étape d’installation préalable.
*npx* installera l’outil à la demande. npx gère aussi les problèmes complexes
du système d’exploitation où l’outil n’est pas trouvé dans le chemin.

```sh
npx genaiscript ...
```

* Ajoutez `--yes` pour passer la confirmation, ce qui est utile dans un scénario CI.

```sh "--yes"
npx --yes genaiscript ...
```

* Spécifiez la plage de versions pour éviter des comportements inattendus avec des installations mises en cache de la CLI avec npx.

```sh "@^1.16.0"
npx --yes genaiscript@^1.16.0 ...
```

## Scripts d’aide

Pour vous assurer que les fichiers de définition TypeScript sont écrits et mis à jour,
vous pouvez ajouter les scripts suivants à votre `package.json`.

```json title="package.json"
{
    "scripts": {
        "postinstall": "genaiscript scripts fix",
        "postupdate": "genaiscript scripts fix",
        "genaiscript": "genaiscript"
    }
}
```

`genaiscript` est aussi un raccourci qui facilite l’invocation de la CLI
avec `npm run` :

```sh
npm run genaiscript ...
```

### Travail derrière un Proxy

Certains paquets optionnels utilisés par la CLI ne supportent pas une installation derrière un proxy HTTP,
ce qui est très courant en environnement d’entreprise.

Si votre environnement de travail nécessite de passer par un proxy,
vous devriez utiliser `npm install --omit=optional`
pour que les paquets optionnels échouent proprement durant l’installation.

Si votre environnement de travail nécessite de passer par un proxy,
vous pouvez définir l’une des variables d’environnement suivantes
(`HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy` ou `https_proxy`) pour que la CLI utilise un proxy,
par exemple `HTTP_PROXY=http://proxy.acme.com:3128`.

## Configuration

La CLI chargera les [secrets](../../../reference/getting-started/configuration/) depuis les variables d’environnement ou un fichier `./.env`.

Vous pouvez remplacer le nom par défaut du fichier `.env` en ajoutant le fichier `--env .env.local`,
ou même importer les deux.

```sh
npx genaiscript run <script> --env .env .env.local
```

## Créer un nouveau script

Crée un nouveau fichier script dans le dossier `genaisrc`.

```sh
npx genaiscript scripts create <name>
```

## Compiler les scripts

Exécute le compilateur TypeScript pour détecter les erreurs dans les scripts.

```sh
npx genaiscript scripts compile
```

## Exécuter un script

[Exécute un script](../../../reference/reference/cli/run/) sur un fichier
et transmet la sortie LLM vers stdout. **Exécuter depuis la racine du workspace**.

```sh
npx genaiscript run <script> [files...]
```

où `<script>` est l’identifiant ou chemin de fichier de l’outil à exécuter, et `[files...]` le nom du fichier spec sur lequel l’exécuter.

La CLI supporte aussi le piping de style UNIX.

```sh
cat README.md | genaiscript run summarize > summary.md
```

### Lister la configuration du modèle

Exécutez la commande `scripts model` pour lister les scripts disponibles et leur configuration de modèle. Cela peut être utile pour diagnostiquer des problèmes de configuration dans les environnements CI/CD.

```sh
npx genaiscript scripts model [script]
```

où \[script] peut être un identifiant de script ou un chemin de fichier.

## Utiliser la CLI en tant qu’API Node.JS

La CLI peut être importée et [utilisée comme une API dans votre application Node.JS](../../../reference/reference/api/).

## À propos du mélange entre fichiers et `--vars`

Les deux paramètres `files` et `--vars` sont des arguments de ligne de commande variables. C’est-à-dire qu’ils consommeront toutes les entrées suivantes jusqu’à ce qu’une nouvelle option commence. Par conséquent, l’ordre est important lors de leur mélange. Il est préférable de placer les fichiers, puis de suivre avec l’option `--vars`.

```sh
genaiscript run <script> [files...] --vars key1=value1 key2=value2
```

* [ambiguïté de parsing](https://github.com/tj/commander.js/blob/HEAD/docs/options-in-depth.md#parsing-ambiguity)

## Sujets

<DirectoryLinks directory="reference/cli" />