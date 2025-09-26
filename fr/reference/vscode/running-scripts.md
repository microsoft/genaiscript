import { YouTube } from "astro-embed"

L'extension GenAIScript pour Visual Studio Code offre un moyen pratique d'exécuter des scripts directement depuis l'éditeur.

<YouTube id="https://youtu.be/dM8blQZvvJg" portraitQuality="high" />

Il existe principalement deux façons d'exécuter des scripts :

* exécuter un script « directement ». Ce scénario est utile lors du débogage d'un script ou pour un script qui ne nécessite aucun fichier d'entrée.
* exécuter un script à partir de fichiers ou dossiers d'entrée. Ce scénario est utile lorsque vous souhaitez exécuter un script sur plusieurs fichiers ou dossiers.

## Exécution directe des scripts

* ouvrir un fichier GenAIScript dans l'éditeur
* cliquer droit dans l'éditeur et sélectionner **Exécuter GenAIScript** dans le menu contextuel
* ou cliquer sur l'icône **Exécuter GenAIScript** dans le coin supérieur droit de l'éditeur

Cela lancera l'exécution du script en utilisant les fichiers d'entrée par défaut spécifiés dans le champ `files` du `script`.

```js 'files'
script({
    files: "...",
})
```

Ce mode est utile lors du développement d'un script ou pour les scripts qui ne nécessitent aucun fichier d'entrée.

## Exécution des scripts à partir de fichiers ou dossiers d'entrée

Ce mode permet d’exécuter des scripts sur n’importe quelle combinaison de fichiers et dossiers, qui alimenteront `env.files`.

### Depuis la fenêtre de l’explorateur :

* sélectionnez n'importe quel fichier ou dossier dans l'explorateur. Vous pouvez utiliser la touche `Ctrl` ou `Shift` pour sélectionner plusieurs fichiers ou dossiers.
* cliquez droit et sélectionnez **Exécuter GenAIScript** dans le menu contextuel

### Depuis un éditeur

* ouvrez un fichier dans l'éditeur (pas un fichier GenAIScript)
* cliquez droit et sélectionnez **Exécuter GenAIScript** dans le menu contextuel

## Utilisation du texte sélectionné dans votre script

Chaque fois que vous lancez un script, GenAIScript récupère le texte sélectionné dans l’éditeur de texte actif et le stocke dans la variable `editor.selectedText`.

```js
const text = env.vars["editor.selectedText"]
```

Cette valeur sera indéfinie si vous exécutez votre script depuis la ligne de commande, vous devez donc gérer ce cas dans votre script.

## Règles du fichier .gitignore

GenAIScript tente de respecter les **règles `.gitignore` de premier niveau dans l'espace de travail du projet** (il ignore les fichiers .gitignore imbriqués). Cela signifie que si vous avez un fichier `.gitignore` dans votre projet, GenAIScript ignorera tous les fichiers ou dossiers exclus par Git.

Il existe des exceptions à cette règle :

* si vous exécutez **Exécuter GenAIScript** sur des fichiers individuels, ces fichiers ne sont pas filtrés par `.gitignore` puisque vous les avez explicitement choisis. Les dossiers sont toujours filtrés.
* si vous spécifiez `---ignore-git-ignore` dans la ligne de commande, GenAIScript ignorera le fichier `.gitignore` et exécutera le script sur tous les fichiers et dossiers.