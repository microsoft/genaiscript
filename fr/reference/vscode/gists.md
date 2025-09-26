[GitHub Gists](https://gist.github.com/) sont un moyen simple de partager des extraits de code et des notes avec d'autres.
Ce sont essentiellement des dépôts Git qui peuvent être créés et partagés facilement.
Les gists peuvent être publics ou secrets, et ils supportent la gestion des versions, ce qui en fait un excellent outil de collaboration.

![Une capture d'écran de GistPad dans Visual Studio Code](../../../reference/vscode/gistpad.png)

## Exécution de GenAIScript à partir des Gists

GenAIScript prend en charge les formats d'URL suivants pour exécuter des scripts directement depuis un gist.

* `gist://<identifiant du gist>/<nom du fichier>`
* `vscode://vsls-contrib.gistfs/open?gist=<identifiant du gist>&file=<fichier>`

```sh
genaiscript run gist://8f7db2674f7b0eaaf563eae28253c2b0/poem.genai.mts
```

Le fichier gist est mis en cache localement dans `.genaiscript/resources` puis exécuté. Si disponible,
il utilise les informations de connexion GitHub pour accéder aux gists privés.

:::caution
GenAIScript utilise des fichiers JavaScript, assurez-vous donc d'exécuter uniquement des gists en lesquels vous avez confiance.
:::

## GistPad dans Visual Studio Code

L'[extension GistPad](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.gistfs)
pour Visual Studio Code vous permet de créer, modifier et gérer des gists directement depuis votre éditeur.

Vous pouvez ouvrir un fichier dans un Gist et l'exécuter en utilisant la commande `genaiscript`.

### Vérification de type

Pour activer la vérification de type, nous devons télécharger le fichier `genaiscript.d.ts` dans le gist et y ajouter une référence
en ajoutant ce commentaire **en haut du fichier** :

```js
/// <reference path="./genaiscript.d.ts" />
```

Cela peut être fait automatiquement :

* clic droit sur le fichier GenAIScript du Gist
* sélectionnez `GenAIScript: Fix Type Definitions`
* Vous pourriez être invité à autoriser GenAIScript à utiliser votre compte GitHub. GenAIScript demandera un jeton avec le scope `gist` pour uploader les fichiers manquants.

Pour charger les types de GenAIScript, il faudra "pousser" un peu le compilateur TypeScript :

* ouvrez le fichier `genaiscript.d.ts` depuis l'arborescence GistPad (cela charge les types en mémoire)
* ouvrez votre fichier GenAIScript dans l'arborescence GistPad et la vérification de type devrait fonctionner !

## Limitations

Comme l'extension GistPad n'est pas un IDE complet, certaines limitations sont à noter :

* les imports ne se résoudront probablement pas