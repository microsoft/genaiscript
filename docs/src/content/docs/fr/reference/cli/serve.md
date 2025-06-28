---
title: Serve
description: Lancer un serveur web local.
sidebar:
  order: 2
hero:
  image:
    alt: A simple 2D server icon in 8-bit style features a computer tower and a
      globe representing network connectivity. Color-coded buttons indicate API
      functions, accompanied by a shield symbol for API key security, a gear
      icon for settings, and an abstract chain to represent CORS. The icon uses
      a five-color flat corporate palette, fits within a 128x128 frame, has a
      transparent background, and includes no text, people, or shadows.
    file: ../../../reference/cli/serve.png

---

Lancer un serveur web local qui est utilisé pour exécuter le bac à sable
ou Visual Studio Code.

Exécuter depuis la racine de l'espace de travail :

```bash
npx genaiscript serve
```

## port

Le port par défaut est `8003`. Vous pouvez spécifier le port en définissant le drapeau `--port`.

```bash
npx genaiscript serve --port 8004
```

## clé API

La clé API est utilisée pour authentifier les requêtes vers le serveur.
Vous pouvez spécifier une clé API en utilisant le drapeau `--api-key` ou la variable d'environnement `GENAISCRIPT_API_KEY`.

```bash
npx genaiscript serve --api-key my-api-key
```

ou

```txt title=".env"
GENAISCRIPT_API_KEY=my-api-key
```

La clé API peut être configurée dans l'en-tête `Authorization` d'une requête ou dans le paramètre de requête URL `api-key` (`http://localhost:8003/#api-key=ma-clé-api`)

## CORS

Vous pouvez activer [Ressource Partagée Cross-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) en utilisant le drapeau `--cors` ou en configurant la variable d'environnement `GENAISCRIPT_CORS_ORIGIN`.

```bash
npx genaiscript serve --cors contoso.com
```

## Réseau

Vous pouvez lier le serveur à `0.0.0.0` pour le rendre accessible depuis le réseau en utilisant le drapeau `--network`. Ce drapeau est nécessaire pour rendre le serveur accessible depuis un conteneur.

```bash
npx genaiscript serve --network
```

Nous recommandons vivement de définir la clé API lors de l'exécution du serveur sur le réseau.

## Dockerisé

Pour exécuter une image Docker minimale avec le serveur, créez d'abord une image Docker avec genaiscript et les outils nécessaires.

```sh
docker build -t genaiscript -<<EOF
FROM node:alpine
RUN apk add --no-cache git && npm install -g genaiscript
EOF
```

Cela crée une image `genaiscript` localement que vous pouvez utiliser pour lancer le serveur.

```sh
docker run --env GITHUB_TOKEN --env-file .env --name genaiscript --rm -it --expose 8003 -p 8003:8003 -v ${PWD}:/workspace -w /workspace genaiscript genaiscript serve --network
```

puis ouvrez `http://localhost:8003` dans votre navigateur.

## Points de terminaison API OpenAI

Le serveur implémente divers points de terminaison compatibles avec l'API OpenAI. Vous pouvez utiliser le serveur comme proxy vers l'API OpenAI en configurant le drapeau `--openai`.
Les routes peuvent être utilisées pour fournir un accès stable aux LLM configurés à d'autres outils comme promptfoo.

```bash
npx genaiscript serve --openai
```

Cela activera les routes suivantes :

### `/v1/chat/completions`

Principalement compatible avec l'API de complétions de chat d'OpenAI. Le serveur transmettra les requêtes à l'API OpenAI et renverra la réponse.

* `stream` n'est pas supporté.

### `/v1/models`

Renvoie la liste des modèles et des alias disponibles sur le serveur.

<hr />

Traduit avec AI. Veuillez vérifier le contenu pour assurer l'exactitude.
