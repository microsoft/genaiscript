import { Code } from "@astrojs/starlight/components";
import code from "../../../../../genaisrc/blog-image.genai.mts?raw";

import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Nous générons des images de couverture pour le blog, ce qui en soi est complètement inintéressant... mais le script qui a généré les images vaut le coup d'œil.

La génération d'une image de couverture pour un article de blog se fait en 3 étapes :

* convertir le markdown du blog en une invite d'image
* générer une image à partir de l'invite d'image
* générer une description de texte alternatif à partir de l'invite d'image
* redimensionner, copier l'image et mettre à jour les métadonnées de l'article de blog

<Code code={code} lang="ts" wrap title="blog-image.genai.mts" />

Une fois que ce script a fonctionné pour quelques articles, nous avons utilisé la commande `convert` pour générer les images pour tous les articles du blog.

```sh
genaiscript convert blog-image blog/*.md*
```

## Et les images ?

Les images sont quelque peu abstraites, mais elles sont générées à partir du contenu de l'article de blog. L'invite d'image pourrait certainement être améliorée, mais c'est un bon début.