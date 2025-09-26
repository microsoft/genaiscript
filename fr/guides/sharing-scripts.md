import { FileTree } from "@astrojs/starlight/components"

Les scripts GenAIScript sont des fichiers et peuvent être partagés comme n'importe quel autre fichier de code.

Tant que les fichiers de script se trouvent dans le dossier du projet, GenAIScript cherchera les fichiers `**/*.genai.js` et `**/*.genai.mjs`.

Voici quelques idées pour partager des fichiers.

## Dépôt Git + sous-modules

Si vous stockez vos scripts dans un dépôt git, vous pouvez utiliser les sous-modules git pour les partager entre plusieurs projets.

* dépôt contenant votre script (par exemple `https://.../shared-scripts`)

<FileTree>
  - shared-scripts/ dépôt git `https://.../shared-scripts`
    * genaisrc/
      * my-script.genai.mjs
      * ...
</FileTree>

* référencement de `shared-scritps` comme sous-module git

```sh
git submodule add https://.../shared-scripts
git submodule update --init --recursive
```

<FileTree>
  * my-project/
    * src/
    * ...
    * shared-scripts/ sous-module git [https://github.com/.../shared-scripts](https://github.com/.../shared-scripts)
      * genaisrc/
        * my-script.genai.mjs
          ...
</FileTree>

## Gists GitHub

[Gists](https://gist.github.com/) est un moyen léger de partager quelques fichiers.