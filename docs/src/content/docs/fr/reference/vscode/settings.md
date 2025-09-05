---
title: Paramètres utilisateur
sidebar:
  order: 200
description: Personnalisez votre expérience VSCode avec les paramètres
  utilisateur GenAIScript pour les diagnostics, la mise en cache et les
  configurations CLI.
keywords: VSCode settings, user preferences, CLI path, extension configuration,
  diagnostics toggle

---

Les paramètres suivants peuvent être accessibles via la commande **Préférences : Ouvrir les paramètres utilisateur**.

## CLI

Ces paramètres contrôlent la manière dont le serveur GenAIScript
est exécuté depuis l'extension.
Par défaut, l'extension utilise [npx](https://www.npmjs.com/package/npx) et la version actuelle de l'extension pour exécuter le CLI GenAIScript.

```sh
genaiscript@[extension_version] serve
```

## Chemin

Si vous avez une version spécifique du CLI installée, vous pouvez définir son chemin ici.

## Version

Par défaut, l'extension utilise npx et la version actuelle de l'extension. Vous pouvez remplacer le numéro de version avec ce paramètre.

```sh
node cli_path serve
```

## Masquer le terminal du serveur

Par défaut, le terminal du serveur GenAIScript est caché après le démarrage du serveur. Activer ce drapeau ouvrira un terminal où vous pourrez inspecter les journaux du serveur GenAIScript.

## Diagnostics

Ce drapeau active diverses options de journalisation supplémentaires et comportements pour aider à diagnostiquer les problèmes avec le serveur GenAIScript.
