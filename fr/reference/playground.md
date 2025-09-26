import { Image } from "astro:assets"
import src from "../../../../assets/playground.png";
import alt from "../../../../assets/playground.png.txt?raw";

Le **Playground** est une application web auto-hébergée qui vous permet d'exécuter des scripts GenAIScript depuis une interface utilisateur conviviale. Il se place entre la CLI GenAIScript et l'intégration GenAIScript pour Visual Studio Code.

> Le playground est encore en cours de développement.

<Image src={src} alt={alt} />

## Lancement

Depuis la racine de votre espace de travail projet, exécutez

```sh
npx --yes genaiscript serve
```

puis accédez à l'URL affichée dans la console (généralement `http://127.0.0.1:8003/`).

## Dépôt distant

Vous pouvez exécuter le playground sur un dépôt distant en utilisant vos secrets `.env` actuels.

```sh
npx --yes genaiscript serve --remote <repository>
```

## Installation locale

`npx` peut être lent au démarrage, surtout si vous lancez fréquemment le playground. Vous pouvez installer le playground localement avec

```sh
npm install -g genaiscript
```

puis lancez

```sh
genaiscript serve
```

## Exécution de scripts depuis un dépôt distant

Vous pouvez utiliser l’option `--remote` pour charger des scripts depuis un dépôt distant.
GenAIScript effectuera un clonage superficiel (shallow clone) du dépôt et exécutera le script depuis le dossier cloné.

```sh
npx --yes genaiscript serve --remote https://github.com/...
```

Il existe des flags additionnels pour contrôler le clonage du dépôt :

* `--remote-branch <branch>` : La branche à cloner depuis le dépôt distant.
* `--remote-force` : Force le clonage même si le dossier cloné existe déjà.
* `--remote-install` : installe les dépendances après le clonage du dépôt.

:::caution
Comme toujours, soyez prudent lorsque vous exécutez des scripts provenant d’un dépôt distant.
Assurez-vous de faire confiance à la source avant d’exécuter le script et envisagez de verrouiller sur un commit spécifique.
:::