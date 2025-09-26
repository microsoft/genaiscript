[Microsoft MakeCode](https://makecode.com) est une plateforme web pour créer des expériences d'apprentissage en informatique engageantes. Elle offre un environnement de programmation par blocs qui permet aux élèves de créer des jeux, des animations et des histoires interactives.

La documentation et les tutoriels MakeCode utilisent [le markdown avec de nombreuses macros supplémentaires et micro-syntaxes](https://makecode.com/writing-docs) pour créer des tutoriels et documentations à rendu riche, comme le [tutoriel Pierre Papier Ciseaux](https://makecode.microbit.org/projects/rock-paper-scissors).

## Défi de localisation

Un défi majeur dans la localisation de la ressource MakeCode est que des outils comme Bing Translator ou Google Translate ont tendance à détruire l'annotation de macro personnalisée ; ce qui casse le rendu riche de la documentation.

Illustrons cela avec l'Étape 6 du tutoriel Pierre Papier Ciseaux :

````markdown wrap
## {Step 6}

Click on the `||variables:Variables||` category in the Toolbox. Drag a `||variables:hand||` block out and drop it into the `||logic:0 = 0||` comparison block replacing the first **0**. Click on the second 0 in the comparison block and change to **1**.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {

    } else {

    }
})
```
````

Dans ce contenu, il est crucial de conserver les annotations `||variables:hand||` et `||logic:0 = 0||` telles quelles. De plus, la macro `blocks` doit rester intacte.

> Malheureusement, les systèmes de traduction traditionnels n'ont pas de moyen de "enseigner" la syntaxe ni de souligner l'importance de ces annotations.

Par exemple, lorsqu'il est traduit en français avec Bing Translate, plusieurs erreurs apparaissent : ` `` ` devient `'`, des espaces supplémentaires, `logic` devient `logique`, etc.

```markdown wrap
## {Étape 6}

Cliquez sur le bouton ''||variables :Variables||'' dans la boîte à outils. Faites glisser un ''||variables :main||'' et déposez-le dans le fichier ''||logique :0 = 0||'' en remplacement du premier **0**. Cliquez sur le deuxième 0 dans le bloc de comparaison et passez à **1**.

'''blocs
let main = 0 ;
input.onGesture(Gesture.Shake, function() {
main = randint(1, 3)
if (main == 1) {
} else {
}
})
'''
```

## Apprendre à l’LLM comment traduire

GenAIScript a permis de développer et d’automatiser un script qui crée des traductions de haute qualité basées sur LLM pour la documentation MakeCode.

Une version (simplifiée) du script est présentée ci-dessous, annotée avec des commentaires.

```js wrap
script({
  title: "Translate MakeCode documentation",
  group: "Translation",
  temperature: 0,
});

// allow CLI argument injection
const langName = env.vars.lang || "French";

// context
const file = env.files[0];
def("ORIGINAL", file, { language: "markdown" });

// task
$`You are an expert at Computer Science education. 
You are an expert at writing MakeCode documentation and tutorials. 
You are an expert ${langName} translator.`;

// task
$`Translate the documentation in ORIGINAL to ${langName}.

- Do not translate header starting with ~
- Do NOT translate code in \`blocks\` or in \`typescript\` or in \`spy\` or in \`python\`. However, you can should comments.
- Do not translate @variable@ or @unplugged
- Translate \`## {<text>}\` as \`## {<translated text>}\`
- When you encounter a snippet like "\`\`||<namespace>:<text>||\`\`", DO NOT translate <namespace> and DO translate text.

\`\`||<namespace>:<text>||\`\` --> \`\`||<namespace>:<translated text>||\`\`
...
`;
```

En utilisant ce script, la traduction de `Step 6` en français est la suivante, et vous remarquerez que toutes les erreurs ont été corrigées.

````markdown wrap
## {Étape 6}

Cliquez sur la catégorie `||variables:Variables||` dans la boîte à outils. Faites glisser un bloc `||variables:main||` et déposez-le dans le bloc de comparaison `||logic:0 = 0||`, en remplaçant le premier **0**. Cliquez sur le deuxième 0 dans le bloc de comparaison et changez-le en **1**.

```blocks
let main = 0;
input.onGesture(Gesture.Shake, function() {
    main = randint(1, 3)
    if (main == 1) {

    } else {

    }
})
```
````

## Automatisation

Notez que nous utilisons la [variable](../../reference/scripts/variables/) `env.vargs.lang` qui permet de modifier cette valeur via la ligne de commande.

```js
const langName = env.vars.lang || "French";
```

Avec l’outil en ligne de commande genaiscript, nous pouvons exécuter le script pour chaque langue souhaitée dans une Action GitHub.

```sh
npx genaiscript run translate ... --vars lang=German
```

### Validation et téléversement

Le CLI peut être automatisé en utilisant votre environnement bash/script préféré. Par exemple, avec [zx](https://google.github.io/zx/), nous automatisons pour plusieurs locales :

* traduire la documentation,
* enregistrer la traduction dans des fichiers,
* exécuter le compilateur MakeCode pour valider les traductions
* téléverser/metttre à jour la base de données de traductions

```js wrap title="ai-translation.mjs"
const langs = ["French", "German", ...]
for(const lang of langs) {
    // run script and create translations
    await $`genaiscript run translate ... --vars lang=${lang} ... --apply-edits`
    // run MakeCode compiler to validate translations
    await $`makecode check-docs ...`
    // upload the database
    await $`translation upload ...`
}
```