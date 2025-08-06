---
title: Annotations
description: Apprenez à ajouter des annotations telles que des erreurs, des
  avertissements ou des notes à la sortie LLM pour une intégration avec VSCode
  ou des environnements CI.
keywords: annotations, LLM output, VSCode integration, CI environment, GitHub Actions
sidebar:
  order: 11
hero:
  image:
    alt: "A simple 8-bit style icon shows a blocky computer monitor with a piece of
      code displayed, overlaid by three symbols: a red triangle signaling an
      error, a yellow exclamation for warning, and a blue note. Next to the
      monitor, flat colored squares symbolize integration points for GitHub,
      VSCode, and a checklist, all designed with basic geometric shapes and
      limited to five distinct colors. The scene has no background or human
      figures."
    file: ../../../reference/scripts/annotations.png

---

Les annotations sont des erreurs, des avertissements ou des notes qui peuvent être ajoutées à la sortie LLM. Elles sont extraites et intégrées dans VSCode ou votre environnement CI.

```js "annotations"
$`Report issues with this code using annotations.`
```

## Configuration

Si vous utilisez `annotation` dans le texte de votre script sans spécifier le champ `system`, `system.annotations` sera ajouté par défaut.

L'utilisation de l'invite système `system.annotations` permet au LLM de générer des erreurs, des avertissements et des notes.

```js ""system.annotations""
script({
    ...
    system: [..., "system.annotations"]
})
```

:::hint
Pour obtenir un rendu esthétique dans la prévisualisation Markdown, essayez l'extension [Markdown Preview for GitHub Alerts](https://marketplace.visualstudio.com/items?itemName=yahyabatulu.vscode-markdown-alert).
:::

### Numéros de ligne

L'invite `system.annotations` active automatiquement l'injection de numéros de ligne pour toutes les sections `def`. Cette amélioration
augmente la précision des réponses du LLM et réduit la probabilité d'hallucinations.

## Commandes GitHub Action

Par défaut, les annotations utilisent la syntaxe [GitHub Action Commands](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message).
Cela signifie que les annotations seront automatiquement extraites par GitHub si vous exécutez votre script dans une GitHub Action.

## Commentaires de révision sur les Pull Requests GitHub

Utilisez l'option `--pull-request-reviews` dans le [cli run](../../../reference/reference/cli/run/#pull-request-reviews/) pour ajouter des annotations comme [commentaires de révision](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/commenting-on-a-pull-request#about-pull-request-comments) sur une pull request.

```sh "cli"
npx --yes genaiscript run ... --pull-request-reviews
```

## Programmes Visual Studio Code

Les annotations sont converties en **Diagnostics** Visual Studio, qui sont présentés à l'utilisateur
via le panneau **Problèmes**. Ces diagnostics apparaissent également sous forme de lignes ondulées dans l'éditeur.

## Format d'Échange des Résultats d'Analyse Statique (SARIF)

GenAIScript convertit ces annotations en fichiers SARIF, qui peuvent être [téléchargés](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) comme des [rapports de sécurité](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), similaires aux rapports CodeQL.

L'extension [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
facilite la visualisation de ces rapports.

```yaml title="GitHub Action"
name: "Upload SARIF"

# Run workflow each time code is pushed to your repository and on a schedule.
# The scheduled workflow runs every Thursday at 15:45 UTC.
on:
    push:
    schedule:
        - cron: "45 15 * * 4"
jobs:
    build:
        runs-on: ubuntu-latest
        permissions:
            # required for all workflows
            security-events: write
            # only required for workflows in private repositories
            actions: read
            contents: read
        steps:
            # This step checks out a copy of your repository.
            - name: Checkout repository
              uses: actions/checkout@v4
            # Run GenAIScript tools
            - name: Run GenAIScript
              run: npx --yes genaiscript ... -oa result.sarif
            # Upload the generated SARIF file to GitHub
            - name: Upload SARIF file
              if: success() || failure()
              uses: github/codeql-action/upload-sarif@v3
              with:
                  sarif_file: result.sarif
```

### Limitations

* L'accès aux rapports de sécurité peut varier en fonction de la visibilité de votre dépôt et des règles organisationnelles. Consultez la [documentation GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository#granting-access-to-security-alerts) pour plus d'informations.
* Votre organisation peut imposer des restrictions sur l'exécution des GitHub Actions pour les Pull Requests.
  Consultez la [documentation GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#about-github-actions-permissions-for-your-repository) pour des informations supplémentaires.

## Filtrage

Vous pouvez utiliser la fonction [defOutputProcessor](../../../reference/reference/scripts/custom-output/) pour filtrer les annotations.

```js "defOutputProcessor"
defOutputProcessor((annotations) => {
    // only allow errors
    const errors = annotations.filter(({ level }) => level === "error")
    return { annotations: errors }
})
```
