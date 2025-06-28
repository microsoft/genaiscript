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

Lancez un serveur web local utilisé pour exécuter le playground
ou Visual Studio Code.

Exécutez depuis la racine de l’espace de travail :

```bash
npx genaiscript serve
```

## port

Le port par défaut est `8003`. Vous pouvez spécifier le port en utilisant le paramètre `--port`.

```bash
npx genaiscript serve --port 8004
```

## Clé API

La clé API est utilisée pour authentifier les requêtes vers le serveur.
Vous pouvez spécifier une clé API en utilisant le paramètre `--api-key` ou la variable d’environnement `GENAISCRIPT_API_KEY`.

```bash
npx genaiscript serve --api-key my-api-key
```

ou

```txt title=".env"
GENAISCRIPT_API_KEY=my-api-key
```

La clé API peut être définie dans l’en-tête `Authorization` d’une requête ou dans le paramètre de requête de l’URL `api-key` (`http://localhost:8003/#api-key=my-api-key`)

## CORS

Vous pouvez activer le [Cross Origin Shared Resource](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) en utilisant le paramètre `--cors` ou en définissant la variable d’environnement `GENAISCRIPT_CORS_ORIGIN`.

```bash
npx genaiscript serve --cors contoso.com
```

## Réseau

Vous pouvez lier le serveur sur `0.0.0.0` et le rendre accessible depuis le réseau en utilisant le paramètre `--network`. Ce paramètre est nécessaire pour rendre le serveur accessible depuis un conteneur.

```bash
npx genaiscript serve --network
```

Nous recommandons vivement de définir la clé API lorsque le serveur est exécuté sur le réseau.

## Dockerisé

Pour exécuter une image Docker minimale avec le serveur, commencez par créer une image Docker avec genaiscript et les outils nécessaires.

```sh
docker build -t genaiscript -<<EOF
FROM node:alpine
RUN apk add --no-cache git && npm install -g genaiscript
EOF
```

Cela crée localement une image `genaiscript` que vous pouvez utiliser pour lancer le serveur.

```sh
docker run --env GITHUB_TOKEN --env-file .env --name genaiscript --rm -it --expose 8003 -p 8003:8003 -v ${PWD}:/workspace -w /workspace genaiscript genaiscript serve --network
```

puis ouvrez `http://localhost:8003` dans votre navigateur.

## Points de terminaison de l’API OpenAI

Le serveur implémente plusieurs points de terminaison compatibles avec l’API OpenAI. Vous pouvez utiliser le serveur comme proxy vers l’API OpenAI en activant le paramètre `--openai`.
Ces routes permettent d’offrir un accès stable aux LLM configurés pour d’autres outils comme promptfoo.

```bash
npx genaiscript serve --openai
```

Cela activera les routes suivantes :

### `/v1/chat/completions`

Principalement compatible avec l’API de complétion de chat d’OpenAI. Le serveur transmettra les requêtes à l’API OpenAI et retournera la réponse.

* `stream` n’est pas pris en charge.

### `/v1/models`

Retourne la liste des modèles et alias disponibles sur le serveur.

<hr />

Traduction réalisée à l’aide de l’IA. Veuillez vérifier le contenu pour en assurer l’exactitude.
