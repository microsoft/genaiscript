L'objet `env.vars` contient un ensemble de valeurs variables. Vous pouvez utiliser ces variables pour paramétrer votre script.

```js wrap
// grab locale from variable or default to en-US
const locale = env.vars.locale || "en-US"
// conditionally modify prompt
if (env.vars.explain)
    $`Explain your reasoning`
```

### Paramètres de script

Il est possible de déclarer des paramètres dans l'appel de la fonction `script`. L'objet `env.vars` contiendra les valeurs de ces paramètres.

```js
script({
    parameters: {
        string: "the default value", // a string parameter with a default value
        number: 42, // a number parameter with a default value
        boolean: true, // a boolean parameter with a default value
        stringWithDescription: {
            // a string parameter with a description
            type: "string",
            default: "the default value",
            description: "A description of the parameter",
        },
    },
})
```

Lors de l'exécution de ce script dans VS Code, l'utilisateur sera invité à fournir des valeurs pour ces paramètres.

### Variables depuis la CLI

Utilisez le champ `vars` dans la CLI pour remplacer les variables. `vars` prend une séquence de paires `clé=valeur`.

```sh
npx genaiscript run ... --vars myvar=myvalue myvar2=myvalue2 ...
```

### Variables dans les tests

Vous pouvez spécifier des variables dans l'objet `tests` de la fonction `script`. Ces variables seront disponibles dans le contexte du test.

```js "vars"
script({
    ...,
    tests: {
        ...,
        vars: {
            number: 42
        }
    }
})
```