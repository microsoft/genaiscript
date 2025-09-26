import { Image } from "astro:assets";
import src from "../../../../assets/playground.png";
import alt from "../../../../assets/playground.png.txt?raw";
import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

La nouvelle version de 2025 apporte un certain nombre de nouvelles fonctionnalités et la prise en charge de nouveaux modèles.

## Playground

Le [Playground](../../reference/playground/) est une application web auto-hébergée qui vous permet d’exécuter des scripts GenAIScript via une interface conviviale. Il se situe entre l’interface en ligne de commande (CLI) de GenAIScript et l’intégration GenAIScript dans Visual Studio Code.

<Image src={src} alt={alt} />

## o1

GenAIScript prend en charge les différentes variantes des modèles [OpenAI o1](https://openai.com/o1/) (mini, preview, ...). Il ajoute aussi la prise en charge d’outils.

o1 est également disponible sur [GitHub Models](https://github.com/marketplace/models/azure-openai/o1/playground) !

```js
script({ model: "github:openai/o1" });
$`Prove that the sum of the angles of a triangle is 180 degrees.`;
```

## DeepSeek

GenAIScript prend en charge [DeepSeek V3](https://www.deepseek.com/) via leur API OpenAI.

```js
script({ model: "deepseek:deepseek-chat" });
$`Prove that the sum of the angles of a triangle is 180 degrees.`;
```