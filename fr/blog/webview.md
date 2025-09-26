import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Dans le passé, notre visualisation dans Visual Studio Code reposait sur la fonction d’aperçu Markdown intégrée. Elle fonctionnait très bien, mais parfois ce n’était pas suffisant. Nous voulions offrir une expérience plus interactive à nos utilisateurs. Nous avons donc décidé de créer une vue web personnalisée pour GenAIScript.

Recréer cette vue nous donne également plus de contrôle sur la prise en charge du rendu de divers sousformats Markdown comme les diagrammes mermaid, les annotations, les mathématiques, ...

![Une capture d'écran de la vue GenAIScript.](../../blog/webview.png)

:::note
Alors que nous testons et migrons vers la nouvelle vue, les anciens éléments de menu `Output`/`Trace` sont toujours accessibles depuis le menu de la barre d'état.
:::

## Accéder à la vue en dehors de Visual Studio Code

Par conséquent, vous pouvez désormais accéder à la vue GenAIScript en dehors de Visual Studio Code. Cela signifie que vous pouvez maintenant **exécuter** vos scripts dans un navigateur ou toute autre application compatible avec les vues web.

Lancez la commande [serve](../../reference/cli/serve/) depuis le [cli](../../reference/cli/) pour démarrer le serveur et suivez les instructions pour ouvrir la vue dans votre navigateur.

```sh
genaiscript serve
```