---
title: Secrets
description: Apprenez à accéder et gérer en toute sécurité les secrets
  d’environnement dans vos scripts avec l'objet env.secrets.
keywords: secrets management, environment variables, secure access, .env file,
  script configuration
sidebar:
  order: 16
hero:
  image:
    alt: A flat, 2D computer screen icon in a geometric 8-bit style shows a minimal
      rectangular file, meant to represent an environment (.env) file, with a
      padlock symbol in front of it to suggest security. Beside this, there are
      clear, overlapping code brackets and a key symbol placed within a circle.
      The design uses only five solid corporate colors, is clean and iconic, and
      fits within a small square with no text, background, people, or shadows.
    file: ../../../reference/scripts/secrets.png

---

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

<hr />

Traduit par IA. Veuillez vérifier le contenu pour plus de précision.
