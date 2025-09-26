import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

GenAIScript est fourni avec un assistant qui indique au LLM de "l'améliorer".
C'est une façon surprenante d'améliorer votre code en répétant un ensemble d'instructions plusieurs fois.

## Explication du code

Passons en revue le script ligne par ligne :

```js
import { makeItBetter } from "@genaiscript/runtime";
```

Cette ligne importe la fonction `makeItBetter` depuis le runtime GenAIScript. Cette fonction est utilisée pour améliorer le code en répétant un ensemble d'instructions plusieurs fois.

```js
def("CODE", env.files);
```

Cette ligne définit une constante nommée "CODE" qui représente les fichiers dans l'environnement. Elle met essentiellement en place le contexte pour le code qui doit être amélioré.

```js
$`Analyze and improve the code.`;
```

Cette ligne est une invite pour le modèle IA. Elle demande au système d'analyser et d'améliorer le code. Le `$` est utilisé pour indiquer qu'il s'agit d'une instruction spéciale, non d'une commande de code classique.

```js
// tell the LLM to 'make it better' 2 times
```

Ce commentaire explique la ligne de code suivante, précisant que la fonction `makeItBetter` sera appelée deux fois.

```js
makeItBetter({ repeat: 2 });
```

Cette ligne appelle la fonction `makeItBetter` avec une option pour répéter le processus d'amélioration deux fois. Elle déclenche le processus d'amélioration.

## ## Comment exécuter le script

Pour exécuter ce script avec le CLI de GenAIScript, vous devez lancer la commande suivante dans votre terminal :

```bash
genaiscript run makeitbetter
```

Pour des instructions détaillées sur l'installation et la configuration du CLI de GenAIScript, consultez la [documentation de GenAIScript](https://microsoft.github.io/genaiscript/getting-started).

En suivant ces étapes simples, vous pouvez exploiter l'IA pour améliorer votre code en toute simplicité ! 🌟