import { Image } from "astro:assets";
import { Code } from "@astrojs/starlight/components";
import scriptSrc from "../../../../../genaisrc/image-alt-text.genai.mjs?raw";
import src from "../../../../assets/debugger.png";
import alt from "../../../../assets/debugger.png.txt?raw";

Il est recommandé de fournir un attribut `alt` pour les images.
Cet attribut sert à décrire l'image aux utilisateurs qui ne peuvent pas la voir.
Il est également utilisé par les moteurs de recherche pour comprendre le contenu de l'image.

```html "alt"
<img src="..." alt="describe the image here" />
```

Cependant, cette tâche peut être fastidieuse et les développeurs sont souvent tentés de l'omettre ou de fournir un texte `alt` générique comme "image".

```html
<img src="..." alt="image" />
```

## Le script

Pour résoudre ce problème, nous avons créé un script qui utilise le modèle OpenAI Vision pour analyser les images de la documentation et générer un texte alternatif descriptif.

Pour commencer, nous supposons que le script s'exécute sur un seul fichier image et nous utilisons [defImage](../../reference/scripts/images/) pour l'ajouter au contexte de la requête.

```js title="image-alt-text.genai.mjs"
const file = env.files[0];
defImages(file);
```

Ensuite, nous donnons une tâche au modèle de langage pour générer un bon texte alternatif.

```js title="image-alt-text.genai.mjs" wrap
...
$`You are an expert in assistive technology. You will analyze each image
and generate a description alt text for the image.`
```

Enfin, nous utilisons [defFileOutput](../../reference/scripts/file-output/) pour définir une destination de sortie de fichier.

```js title="image-alt-text.genai.mjs" wrap
...
defFileOutput(file.filename + ".txt", `Alt text for image ${file.filename}`)
```

## Utilisation dans Astro

La documentation GenAIScript utilise Astro, qui permet de créer des pages en [MDX](https://docs.astro.build/en/guides/markdown-content/).
Le code ci-dessous montre comment le texte alternatif généré, stocké dans un fichier texte séparé, est injecté dans le HTML final.

```mdx
import { Image } from "astro:assets";
import src from "../../../assets/debugger.png";
import alt from "../../../assets/debugger.png.txt?raw";

<Image src={src} alt={alt} />
```

L'image `debugger.png` montre une capture d'écran d'une session de débogage ainsi que le contenu du fichier texte généré pour le texte alternatif.

<Image src={src} alt={alt} />

<Code code={alt} wrap={true} lang="txt" title="debugger.png.txt" />

## Automatisation

Avec la commande [run](../../reference/cli/run/), nous pouvons appliquer le script à chaque image dans la documentation.

```sh
for file in assets/**.png; do
  npx --yes genaiscript run image-alt-text "$file"
```

Pour éviter de régénérer le texte alternatif, nous détectons également si un fichier existe dans le script et annulons l'opération en conséquence.

```sh title="image-alt-text.genai.mjs" wrap
for file in assets/**.png; do
  if [ ! -f "$file" ]; then
    npx --yes genaiscript run image-alt-text "$file"
  fi
done
```

## Code source complet

Le code source complet est le suivant :

<Code code={scriptSrc} wrap={true} lang="js" title="image-alt-text.genai.mjs" />