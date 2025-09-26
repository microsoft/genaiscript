import { YouTube } from "astro-embed"
import copilotSrc from "../../../../assets/chat-participant.png";
import copilotAlt from "../../../../assets/chat-participant.png.txt?raw";
import { Image } from "astro:assets"

:::caution
Les scripts sont exécutés dans le contexte de votre environnement.
**N'exécutez que des scripts de confiance.**
:::

## Visual Studio Code

Dans Visual Studio Code, l'emplacement à partir duquel vous commencez à exécuter un script détermine les entrées dans la variable [`env.files`](../../reference/scripts/context/).

<YouTube id="https://youtu.be/dM8blQZvvJg" portraitQuality="high" />

### Fichier unique

* Cliquez avec le bouton droit sur un fichier dans l'explorateur et sélectionnez **Run GenAIScript...**.
* Ou bien, cliquez avec le bouton droit dans un éditeur de fichier et sélectionnez **Run GenAIScript...**.

Le tableau `env.files` contiendra un seul élément correspondant au fichier sélectionné.

Une fenêtre de l'explorateur de fichiers affiche divers fichiers et dossiers. Le fichier "Document.docx" est sélectionné, et un menu contextuel est ouvert avec l'option "Exécuter GenAIScript..." mise en évidence.

### Dossier

* Cliquez avec le bouton droit sur un dossier dans l'explorateur et sélectionnez **Run GenAIScript...**.

Le tableau `env.files` contiendra tous les fichiers imbriqués dans ce dossier.

L'image montre un explorateur de fichiers avec un menu contextuel. Le dossier "rag" est développé, affichant des fichiers comme "Document.docx". Le menu contextuel inclut des options telles que "Nouveau fichier", "Couper", "Copier" et "Exécuter GenAIScript."

:::tip[Dossier racine]
Pour exécuter le script sur le dossier racine, effectuez un clic droit sous les fichiers.

Une capture d'écran d'un explorateur de fichiers dans un éditeur de code montre divers fichiers et dossiers. Le menu contextuel est ouvert avec l'option "Exécuter GenAIScript..." mise en évidence par une flèche rouge.
:::

### GitHub Copilot Chat

Vous pouvez exécuter des scripts dans [GitHub Copilot Chat](https://code.visualstudio.com/docs/copilot/getting-started-chat) à travers le participant [**@genaiscript**](../../reference/vscode/github-copilot-chat/).

<Image src={copilotSrc} alt={copilotAlt} loading="lazy" />

### Fichiers par défaut

Vous pouvez spécifier un ou plusieurs fichiers par défaut pour exécuter le script.
Lorsque vous exécutez le script depuis son propre fichier script, ou avec la ligne de commande sans arguments de fichier,
les fichiers par défaut seront utilisés.

```js
script({
    files: "path/to/files*.md",
})
...
```

### Tâches

L'extension GenAIScript expose automatiquement chaque script comme une [Tâche](https://code.visualstudio.com/docs/editor/tasks).

La tâche lance le [cli](../../reference/cli/) et exécute le script sélectionné en passant le chemin vers l'éditeur ouvert actuellement.

* Ouvrez la palette de commande `Ctrl+Shift+P` et recherchez "Tasks: Run Task".
* Sélectionnez le fournisseur de tâches `genaiscript`.
* Choisissez le script que vous souhaitez exécuter.

:::note
Lorsque vous exécutez un script en tant que tâche, le résultat ne sera pas visible dans la fenêtre de traçage de GenAIScript.
:::

### Analyser les résultats

Par défaut, GenAIScript ouvre l'aperçu de sortie qui montre une vue rendue de la sortie du LLM (en supposant que le LLM produise du Markdown).

La vue GenAIScript fournit un aperçu de la trace de la dernière exécution.

Vous pouvez également utiliser la **Trace** pour examiner chaque étape de transformation de l'exécution du script.

* Cliquez sur l'icône de la barre d'état de GenAIScript pour accéder à diverses options permettant d'examiner les résultats.

Une capture d'écran d'un éditeur de code montre un menu déroulant avec les options "Réessayer", "Sortie" et "Trace", des données JSON listant des villes et leur population, et une barre d'état indiquant "150 jetons" générés par l'IA.

## Ligne de commande

Commencez par créer un script en utilisant la [ligne de commande](../../reference/cli/).

* JavaScript

```sh
npx genaiscript scripts create proofreader
```

* TypeScript "--typescript"

```sh
npx genaiscript scripts create proofreader --typescript
```

La commande `scripts create` génère également un fichier de définition TypeScript (`genaiscript.d.ts` et `tsconfig.json`) pour activer la vérification des types et l'auto-complétion dans votre éditeur. Si vous devez régénérer ce fichier de définition TypeScript, utilisez `scripts fix`.

```sh
npx genaiscript scripts fix
```

Utilisez la commande [run](../../reference/cli/run/) pour exécuter un script depuis la ligne de commande.

```sh
npx genaiscript run proofreader path/to/files*.md
```

:::tip
Si vous prévoyez d'utiliser fréquemment la [ligne de commande](../../reference/cli/),
il est préférable de l'installer localement, car le temps de démarrage de `npx` peut être lent.

* en tant que dépendance de développement

```sh
npm install -D genaiscript
```

* en tant que package global

```sh
npm install -g genaiscript
```
:::

Vous pouvez démarrer un [bac à sable](../../reference/playground/) pour exécuter des scripts de manière interactive via une interface web similaire à l'extension Visual Studio Code.

```sh
npx genaiscript serve
```

## Étapes suivantes

[Déboguez](../../getting-started/debugging-scripts/) vos scripts en utilisant le débogueur de Visual Studio Code !

## Autres intégrations

Celles-ci ne sont pas activement maintenues par l'équipe GenAIScript, mais nous essayons de les faire fonctionner autant que possible. Si vous rencontrez des problèmes, veuillez signaler les erreurs.

### Cursor

GenAIScript peut être installé dans [Cursor](https://cursor.sh/how-to-install-extension)
en suivant les étapes d'installation manuelle.

### Neovim

Le projet [genaiscript-runner.nvim](https://github.com/ryanramage/genaiscript-runner.nvim) fournit un plugin pour exécuter des scripts GenAIScript.