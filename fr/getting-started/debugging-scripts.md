import { Image } from "astro:assets"
import src from "../../../../assets/debugger.png";
import alt from "../../../../assets/debugger.png.txt?raw";

Les fichiers de script GenAIScript sont des JavaScript exécutables et peuvent être débogués à l'aide du [débogueur de Visual Studio Code](https://code.visualstudio.com/Docs/editor/debugging), comme tout autre programme JavaScript.

<Image src={src} alt={alt} />

:::tip
GenAIScript fournit également un [journalisation légère intégrée](../../reference/scripts/logging/) pour vous aider à dépanner vos scripts sans débogueur.
:::

## Démarrer une session de débogage

* Ouvrez le fichier `.genai.mjs` à déboguer et ajoutez des points d'arrêt.

### Depuis les fichiers env

* Cliquez droit dans l'éditeur du fichier que vous souhaitez dans `env.files`.
* Sélectionnez GenAIScript dans le sélecteur.

#### Depuis le script lui-même

* Ajoutez un champ `files` dans la fonction `script`

```js
script({
    ...,
    files: "*.md"
})
```

* Cliquez sur le bouton icône **Déboguer** dans le menu de l'éditeur (caché sous le bouton d'exécution).

Le débogueur lancera le [cli](../../reference/cli/) et exécutera le script en mode débogage.
Le débogueur s'arrêtera aux points d'arrêt que vous avez définis.

## Limitations

Le JavaScript s'exécute dans un processus Node externe. Par conséquent,

* L'aperçu et la sortie de la trace ne sont pas pris en charge pendant le débogage.

## Étapes suivantes

Continuez à itérer sur le script ou [ajoutez des tests](../../getting-started/testing-scripts/).