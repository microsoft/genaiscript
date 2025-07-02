---
title: Descripteur de Pull Request
description: Générer une description pour une pull request
sidebar:
  order: 5
cover:
  alt: 'A retro 8-bit-inspired geometric illustration depicting a folder named
    ".genaisrc" with a file titled "prd.genai.mts" inside. Surrounding the
    folder are symbolic icons: arrows and file comparison lines representing git
    diffs, a GitHub logo, a cloud icon symbolizing GitHub Actions, a gear for
    automation, and a shield for content safety. The artwork integrates five
    corporate colors and maintains simplicity without text or human figures.'
  image: ../../samples/prd.png
tags:
  - 1. GitHub Actions Automation
  - 2. Pull Request Description Generator
  - 3. Code Review Script
  - 4. GenAIScript Integration
  - 5. Content Safety Measures
excerpt: >-
  Rationalisez votre processus de pull request avec des descriptions
  automatisées. Dans ce guide, vous apprendrez à créer un script qui génère des
  résumés de haut niveau des modifications apportées au code dans les pull
  requests. Le script peut être exécuté localement pour les tests et les
  ajustements, puis intégré avec GitHub Actions pour une automatisation
  transparente.


  Principaux points à retenir :


  - Utilisation de `git.diff` pour extraire les changements et résumer leur
  intention.

  - Ajout de mécanismes de sécurité pour éviter la génération de contenu
  nuisible.

  - Utilisation d’agents comme `fs_read_file` ou `agent_fs` pour une analyse
  contextuelle plus approfondie.

  - Automatisation du processus avec un workflow GitHub pour mettre à jour
  dynamiquement les descriptions de pull request.


  Cette approche améliore non seulement l’efficacité des développeurs mais
  renforce aussi la clarté lors de la revue du code. Adaptez-la à votre manière
  de travailler et profitez d’une collaboration plus fluide.

---

L'exemple suivant montre un script qui génère une description des modifications dans une pull request.
Nous allons développer le script localement puis créer une GitHub Action pour l'exécuter automatiquement.

## Ajouter le script

* **Créez une nouvelle branche** dans votre dépôt.
* Ajoutez le script suivant à votre dépôt sous le nom `prd.genai.mts` dans le dossier `.genaisrc`.

```ts title="genaisrc/prd.genai.mts" wrap
script({
    title: "Pull Request Descriptor",
    description: "Generate a description for the current pull request",
    systemSafety: true,
    parameters: {
        base: "",
    },
})
const { dbg, vars } = env
const base = vars.base || (await git.defaultBranch())
const changes = await git.diff({
    base,
    llmify: true,
})
if (!changes) cancel("No changes found in the pull request")
dbg(`changes: %s`, changes)
const gitDiff = def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 14000,
    detectPromptInjection: "available",
})
$`## Task

You are an expert code reviewer with great English technical writing skills.

Your task is to generate a high level summary of the changes in ${gitDiff} for a pull request in a way that a software engineer will understand.
This description will be used as the pull request description.

## Instructions

- do NOT explain that GIT_DIFF displays changes in the codebase
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use gitmojis to make the description more engaging
- focus on the most important changes
- do not try to fix issues, only describe the changes
- ignore comments about imports (like added, remove, changed, etc.)
`
```

* Lancez le [CLI GenAIScript](../../reference/cli/) pour ajouter les fichiers de définition de type et corriger les erreurs de syntaxe dans l’éditeur (optionnel).

```bash
npx --yes genaiscript script fix
```

Le script commence par une section de métadonnées (`script({ ... })`) qui définit le titre, la description et les options de sécurité système.
Le script utilise ensuite l'outil `git` pour obtenir la différence (diff) de la pull request et la stocke dans la variable `GIT_DIFF`.

Le script utilise ensuite le littéral de gabarit `$` pour générer un rapport basé sur la différence. Le rapport inclut les meilleures pratiques pour le langage de programmation de chaque fichier, et il est important d'analyser tout le code.
Le script comprend également une note recommandant d'utiliser des outils pour lire le contenu complet des fichiers afin d'obtenir plus de contexte et d'éviter de signaler des avertissements.

## Run the script locally

Assurez-vous de valider vos modifications sur la branche et de les pousser sur GitHub. Puis **créez une nouvelle pull request**.

Puisque vous êtes déjà dans une pull request, vous pouvez exécuter le script et ajuster les requêtes selon vos besoins.
Vous pouvez utiliser l'extension GenAIScript pour Visual Studio Code ou utiliser la CLI.

```sh
npx --yes genaiscript run prd
```

Vous verrez une sortie similaire à ce qui suit. Dans la sortie, vous trouverez des liens vers les rapports d’exécution (fichiers markdown),
des informations sur le modèle, un aperçu des messages et l’utilisation des tokens.

Ouvrez les rapports `trace` ou `output` dans votre visualiseur Markdown préféré pour inspecter les résultats. Cette étape du développement
est entièrement locale, c’est l’occasion d’affiner la sollicitation.

```text
┌─💬 github:gpt-4.1 ✉ 2 ~↑729t
┌─📙 system
│## Safety: Jailbreak
│... (18 lines)
│- **Do NOT use function names starting with 'functions.'.
│- **Do NOT respond with multi_tool_use**.
┌─👤 user
│<GIT_DIFF lang="diff">
│--- genaisrc/prd.genai.mts
│+++ genaisrc/prd.genai.mts
│@@ -2,7 +2,7 @@ script({
│[2]      title: "Pull Request Descriptor",
│[3]      description: "Generate a description for the current pull request",
│... (24 lines)
│- try to extract the intent of the changes, don't focus on the details
│- use bullet points to list the changes
│- use gitmojis to make the description more engaging
│- focus on the most important changes
│- do not try to fix issues, only describe the changes
│- ignore comments about imports (like added, remove, changed, etc.)

- 🔒 Removed agent_git tool from both "Pull Request Descriptor" and "Pull Request Reviewer" scripts, leaving only the agent_fs tool enabled
- 🛡️ Maintained systemSafety and general parameter structure unchanged in both scripts

└─🏁  github:gpt-4.1 ✉ 2 1165ms ⇅ 909t ↑844t ↓65t 0.221¢
```

## Automatiser avec GitHub Actions

En utilisant [GitHub Actions](https://docs.github.com/en/actions) et [GitHub Models](https://docs.github.com/en/github-models),
vous pouvez automatiser l'exécution du script et la création des commentaires.

* Ajoutez le workflow suivant dans votre dépôt GitHub.

```yaml title=".github/workflows/genai--pull-request-description.yml" wrap
name: genai pull request description
on:
    pull_request:
        types: [ready_for_review, review_requested]
concurrency:
    group: genai-pr-review-${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
permissions:
    contents: read # permission to read the repository
    pull-requests: write # permission to write a comment
    models: read # permission to use github models
jobs:
    describe:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: "22"
            - name: fetch base branch
              run: git fetch origin ${{ github.event.pull_request.base.ref }}
            - name: genaiscript prd
              continue-on-error: true
              run: npx --yes genaiscript run prd --vars base=origin/${{ github.event.pull_request.base.ref }} --pull-request-description --out-trace $GITHUB_STEP_SUMMARY
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

L'action se déclenche lorsque la pull request est marquée comme `ready_for_review` ou lorsqu'une revue est demandée.

```yaml
    pull_request:
        types: [ready_for_review, review_requested]
```

La ligne de commande utilise un drapeau spécial pour mettre à jour la description générée de la pull request :

* `--pull-request-description` pour mettre à jour la description de la pull request

Nous avons également ajouté `continue-on-error: true` afin que le workflow ne soit pas interrompu si le script échoue.

* Validez les modifications, créez une nouvelle pull request et commencez à tester le workflow en demandant une revue ou en déclenchant l’événement `ready_for_review`.

## Sécurité du contenu

Les mesures suivantes sont prises pour garantir la sécurité du contenu généré.

* Ce script inclut des invites système pour empêcher les injections de prompt et la génération de contenu nuisible.
  * [system.safety\_jailbreak](../../reference/scripts/system#systemsafety_jailbreak/)
  * [system.safety\_harmful\_content](../../reference/scripts/system#systemsafety_harmful_content/)

Des mesures supplémentaires pour renforcer la sécurité consisteraient à utiliser [un modèle avec un filtre de sécurité](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
ou à valider le message avec un [service de sécurité du contenu](../../reference/scripts/content-safety/).

Consultez la [Note de transparence](../../reference/transparency-note/) pour plus d’informations sur la sécurité du contenu.

## Rendez-le Agentique

GenAIScript fournit plusieurs agents intégrés, y compris un agent pour le système de fichiers et un agent git.
Cela peut être utile pour que le LLM lise les fichiers dans la pull request et les analyse.

Il existe essentiellement deux niveaux d'agentivité que vous pouvez atteindre avec GenAIScript :

### Outils

* ajoutez la [fs\_read\_file](../../reference/scripts/system/#systemfs_read_file/) pour lire les fichiers dans le script.

```ts title="genaisrc/prd.genai.mts" wrap 'tools: ["fs_read"]'
script({
    ...,
    tools: ["fs_read_file"],
})
```

### Agents

* ajoutez l'[agent du système de fichiers](../../reference/scripts/system/#systemagent_fs/) qui peut répondre à des requêtes plus complexes au prix de tokens supplémentaires.

```ts title="genaisrc/prd.genai.mts" wrap 'tools: ["agent_fs"]'
script({
    ...,
    tools: ["agent_fs"],
})
```
