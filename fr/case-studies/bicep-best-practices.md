import { Image } from "astro:assets";
import { Code } from "@astrojs/starlight/components";
import bicepSource from "../../../../../../samples/sample/src/bicep/web-app-basic-linux.bicep?raw";
import scriptSource from "../../../../../../samples/sample/genaisrc/bicep-best-practices.genai.mjs?raw";
import src from "../../case-studies/bicep-best-practices.png";
import alt from "../../case-studies/bicep-best-practices.png.txt?raw";

[Azure Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview?tabs=bicep) est un langage spécifique à un domaine (DSL) pour déployer de manière déclarative des ressources Azure.
C'est un langage conçu pour être plus lisible
et plus facile à maintenir afin de définir les ressources Azure.

Bicep est livré avec un [linter](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/linter) qui détecte différentes erreurs, mais propose également
des meilleures pratiques en ligne qui ne sont pas entièrement couvertes par le linter.

## Application Web Basique Linux

Le fichier suivant est un fichier Bicep qui déploie une application web avec un plan de service d'application Linux.
C’est l’exemple de modèle **microsoft.web/webapp-basic-linux/main.bicep**
dans le [bac à sable Bicep](https://azure.github.io/bicep/).

<Code code={bicepSource} wrap={true} lang="bicep" title="web-app-basic-linux.bicep" />

## Script

Le fichier est conforme au `linter`, mais certaines améliorations peuvent être apportées en suivant les meilleures pratiques.
Le script suivant appliquera les meilleures pratiques au fichier Bicep.

<Code code={scriptSource} wrap={true} lang="js" title="bicep-best-practices.genai.mjs" />

* des numéros de ligne sont ajoutés au contenu du fichier pour aider le LLM à localiser précisément les problèmes.

```js "lineNumbers"
def("FILE", env.files, {
  endsWith: ".bicep",
  lineNumbers: true,
});
```

* le script utilise un support intégré pour les [annotations](../../reference/scripts/annotations/)
  pour générer des avertissements et des erreurs analysables. Les annotations sont automatiquement intégrées comme problèmes
  dans VSCode ou comme erreurs de build dans la chaîne CI/CD.

```js "annotations"
$`... and generate annotations ...`;
```

* ajout du support pour ignorer les faux positifs en utilisant le commentaire `#disable-next-line genaiscript`

```js wrap
$`- If a line starts with "#disable-next-line genaiscript", ignore the next line.`;
```

* GPT-4 connaît déjà les meilleures pratiques pour Bicep, il n’est pas nécessaire de les répéter !

## Résultats

Le LLM génère 3 annotations pour le fichier Bicep. Les annotations sont affichées
sous forme de lignes ondulées dans VSCode.

<Image src={src} alt={alt} />