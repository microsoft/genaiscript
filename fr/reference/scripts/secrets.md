L'objet `env.secrets` est utilisé pour accéder aux secrets depuis l'environnement. Les secrets sont généralement stockés dans le fichier `.env` à la racine du projet (ou dans le `process.env` pour l'interface en ligne de commande).

Vous devez déclarer la liste des secrets requis dans `script({ secrets: ... })` afin de pouvoir les utiliser dans le script.

```txt title=".env"
SECRET_TOKEN="..."
...
```

* déclarez l'utilisation dans `script`

```js
script({
    ...
    secrets: ["SECRET_TOKEN"]
})
```

* accédez au secret dans le script via `env.secrets`

```js
const token = env.secrets.SECRET_TOKEN
...
```