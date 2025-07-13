---
title: Conteneurs
description: Découvrez comment utiliser les conteneurs pour une exécution
  sécurisée et isolée de code non fiable avec Docker dans le développement de
  logiciels.
keywords: Docker, Containers, Software Development, Code Isolation, Execution Environment
sidebar:
  order: 20
hero:
  image:
    alt: A small, pixel-style image shows a geometric box with a gear and code
      brackets inside, representing a software package. A tiny shield stands
      beside the box to signal security. Clean lines and shapes suggest network
      connections and ports, using five corporate colors, arranged simply and
      without any text or background.
    file: ../../../reference/scripts/container.png

---

Les conteneurs, comme [Docker](https://www.docker.com/), sont un moyen de regrouper un logiciel et ses dépendances dans une unité standardisée pour le développement logiciel. Les conteneurs sont des packages logiciels légers, autonomes et exécutables qui incluent tout ce qui est nécessaire pour exécuter une application : code, environnement d'exécution, outils système, bibliothèques système et paramètres.

:::caution[Exécution de code non fiable]
Si vous envisagez d'exécuter du code généré par un LLM, vous **devez** le considérer comme **non fiable** et utiliser des conteneurs pour isoler l'environnement d'exécution.
:::

## Prérequis

GenAIScript utilise Docker pour orchestrer les conteneurs.

* [Installer Docker](https://docs.docker.com/engine/install/)

## Démarrer un conteneur

Commencez par créer et démarrer un nouveau conteneur. GenAIScript récupérera l'image du conteneur à la demande, supprimant le conteneur lorsqu'il n'est plus nécessaire.

```js
const container = await host.container()
```

### Image personnalisée

Par défaut, le conteneur utilise l'image [python:alpine](https://hub.docker.com/_/python/), qui fournit un environnement Python minimal. Vous pouvez changer l'image en utilisant l'option `image`.

```js 'image: "python:3"'
const container = await host.container({ image: "node:20" })
```

### Création d'images

Utilisez [docker build](https://docs.docker.com/build/) pour créer des images réutilisables.

Vous pouvez construire une image personnalisée à partir d'un dépôt GitHub avec une seule commande dans vos scripts.

```js
const repo = "codelion/optillm" // GitHub repository = image name
const branch = "main"
const dir = "."
await host.exec(
    `docker build -t ${repo} https://github.com/${repo}.git#${branch}:${dir}`
)
```

Ensuite, utilisez le dépôt comme nom d'image.

```js
const container = await host.container({ image: repo, ... })
```

### Désactiver la suppression automatique

Par défaut, le conteneur est supprimé lorsqu'il n'est plus nécessaire. Vous pouvez désactiver ce comportement en utilisant l'option `persistent`.

```js "persistent"
const container = await host.container({ persistent: true })
```

### Activer le réseau

Par défaut, le réseau du conteneur est désactivé, et les requêtes web ne fonctionneront pas. C'est la solution la plus sûre ; si vous devez installer des paquets supplémentaires, il est recommandé de créer une image avec tous les logiciels nécessaires inclus.

Vous pouvez activer l'accès réseau en utilisant `networkEnabled`.

```js
const container = await host.container({ networkEnabled: true })
```

### Mappage des ports

Vous pouvez mapper les ports du conteneur aux ports de l'hôte et accéder aux serveurs web exécutés dans le conteneur.

Par exemple, cette configuration mappera le port `8088` de l'hôte au port `80` du conteneur, et vous pourrez accéder à un serveur web local en utilisant `http://localhost:8088/`.

```js "ports"
const container = await host.container({
    networkEnabled: true,
    ports: {
        containerPort: "80/tcp",
        hostPort: 8088,
    }, // array also supported
})
```

Ensuite

## Exécuter une commande

Vous pouvez exécuter une commande dans le conteneur en utilisant la méthode `exec`. Elle retourne le code de sortie, ainsi que les flux standard de sortie et d'erreur.

```js
const { stdout } = await container.exec("python", ["--version"])
```

## Lire et écrire des fichiers

Le conteneur dispose d'un volume monté dans le système de fichiers de l'hôte, permettant de lire et d'écrire des fichiers depuis le conteneur.

```js
await container.writeText("hello.txt", "Hello, world!")
const content = await container.readText("hello.txt")
```

## Copier des fichiers dans le conteneur

Vous pouvez également copier des fichiers de l'hôte vers le conteneur.

```js
// src/* -> ./src/*
await container.copyTo("src/**", ".")
```

## Déconnecter le réseau

Si vous avez créé le conteneur avec le réseau activé, vous pouvez déconnecter le réseau pour isoler le conteneur.

```js
await container.disconnect()
```

## Utilisation des conteneurs dans les outils

Le guide [outils conteneurisés](../../../reference/guides/containerized-tools/) montre comment utiliser les conteneurs dans les outils pour gérer en toute sécurité du texte non fiable.
