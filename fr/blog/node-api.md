import { PackageManagers } from "starlight-package-managers";

import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Une demande de fonctionnalité récurrente était de pouvoir exécuter GenAIScript de manière programmatique depuis d'autres scripts. Nous sommes heureux d'annoncer que nous avons publié une API Node.JS pour GenAIScript. Cette API vous permet d'appeler GenAIScript depuis d'autres scripts TypeScript (v1.83+).

* [Documentation](https://microsoft.github.io/genaiscript/reference/api/)

## Installation

Vous devrez ajouter [genaiscript](https://www.npmjs.com/package/genaiscript) en tant que dépendance (dev) à votre projet.

<PackageManagers pkg="@genaiscript/api" />

## L’API `run`

L’API `run` est conçue pour imiter le comportement de l’interface en ligne de commande (CLI) de GenAIScript. Elle prend les mêmes arguments que la CLI et retourne les mêmes résultats. Cela vous permet d’appeler GenAIScript depuis d’autres scripts TypeScript.

```js
import { run } from "@genaiscript/api";
const results = await run("summarize", ["myfile.txt"]);
```

L’objet résultat contient la liste complète des messages, ainsi que des informations analysées supplémentaires telles que les fichiers modifiés, les diagnostics, etc.

## Ne touchez pas à mon processus

Du côté de l’appelant, [l’implémentation de run](https://github.com/microsoft/genaiscript/blob/main/packages/cli/src/api.ts) est une fonction sans dépendance ni effet secondaire. Elle crée un thread worker où GenAIScript effectue le travail.

* Aucune variable globale ajoutée
* Aucun package chargé
* Quelques centaines de `b` de mémoire utilisées

## Aidez-nous à l’améliorer !

Évidemment, il s’agit d’un premier jet et nous pourrions mieux faire en proposant des callbacks pour le suivi de progression. Envoyez-nous vos retours !