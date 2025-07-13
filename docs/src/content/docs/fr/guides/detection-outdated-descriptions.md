---
title: Détection des descriptions obsolètes
sidebar:
  order: 7
description: Automatisez la détection des descriptions obsolètes dans la
  documentation Markdown pour maintenir précision et cohérence.
keywords: outdated descriptions, documentation automation, markdown,
  frontmatter, GenAIScript

---

La documentation développeur inclut généralement une description dans chaque fichier. Ces descriptions peuvent devenir obsolètes, entraînant confusion et informations incorrectes. Pour éviter cela, vous pouvez automatiser la détection des descriptions obsolètes dans votre documentation à l'aide de GenAIScript.

## Markdown et frontmatter

De nombreux systèmes de documentation utilisent le format Markdown pour rédiger la documentation et un en-tête 'frontmatter' pour stocker les métadonnées. Voici un exemple de fichier Markdown avec frontmatter :

```markdown
---
title: "My Document"
description: "This is a sample document."
---

# My Document

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
```

L'objectif est de créer un script qui détecte lorsque le champ `description` dans le frontmatter est obsolète.

## Le script

GenAIScript est conçu pour s'exécuter sur des fichiers et fournit une variable spéciale `env.files` qui contient la liste des fichiers à analyser. Vous pouvez utiliser cette variable pour inclure les fichiers dans le contexte en utilisant la fonction [def](../../reference/scripts/context/). Nous limitons chaque fichier à 2000 tokens pour éviter d'exploser le contenu sur de gros fichiers.

```js title="detect-outdated-descriptions.genai.mjs"
// Define the file to be analyzed
def("DOCS", env.files, { endsWith: ".md", maxTokens: 2000 })
```

L'étape suivante consiste à donner une tâche au script. Dans ce cas, vérifier que le contenu et le champ `description` dans le frontmatter correspondent.

```js
// Analyze the content to detect outdated descriptions
$`Check if the 'description' field in the front matter in DOCS is outdated.`
```

Enfin, nous utilisons la fonctionnalité de génération de diagnostics intégrée pour créer une erreur pour chaque description obsolète.

```js
// enable diagnostics generation
$`Generate an error for each outdated description.`
```

## Exécution dans Visual Studio Code

Une fois que vous avez enregistré ce script dans votre espace de travail, vous pourrez l'exécuter sur un fichier ou un dossier via le menu contextuel en sélectionnant **Exécuter GenAIScript...**.

![Une fenêtre d'éditeur de code affiche un fichier Markdown avec des métadonnées pour une page de documentation intitulée "Containers". Les champs description et mots-clés sont mis en évidence. En bas, des avertissements dans l'onglet des problèmes indiquent des descriptions obsolètes.](../../../../assets/detect-outdated-descriptions.png)

## Automatisation

Vous pouvez exécuter automatiquement cet outil sur vos fichiers de documentation pour identifier les descriptions obsolètes en utilisant le [cli](../../reference/cli/).

```sh
genaiscript run detect-outdated-descriptions **/*.md
```

Ce script peut être intégré dans votre pipeline CI/CD pour automatiser le processus de détection.
