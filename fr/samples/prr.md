L'exemple suivant montre un script qui analyse les modifications dans une pull request et publie les commentaires sur GitHub.
Nous développerons le script localement puis créerons une action GitHub pour l'exécuter automatiquement.

## Ajouter le script

* Ouvrez votre dépôt GitHub et lancez une nouvelle pull request.
* Ajoutez le script suivant à votre dépôt sous le nom `genaisrc/prr.genai.mts`.

```ts title="genaisrc/prr.genai.mts" wrap
script({
    title: "Pull Request Reviewer",
    description: "Review the current pull request",
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
$`Report errors in ${gitDiff} using the annotation format.

- Use best practices of the programming language of each file.
- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
- Use tools to read the entire file content to get more context
- Do not report warnings, only errors.
- Add suggestions if possible, skip if you are not sure about a fix.
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

Puisque vous êtes déjà dans une pull request, vous pouvez exécuter le script et ajuster les requêtes selon vos besoins.
Vous pouvez utiliser l'extension GenAIScript pour Visual Studio Code ou utiliser la CLI.

```sh
npx --yes genaiscript run prr
```

Vous verrez une sortie similaire à ce qui suit. Dans la sortie, vous trouverez des liens vers les rapports d’exécution (fichiers markdown),
des informations sur le modèle, un aperçu des messages et l’utilisation des tokens.

Ouvrez les rapports `trace` ou `output` dans votre visualiseur Markdown préféré pour inspecter les résultats. Cette étape du développement
est entièrement locale, c’est l’occasion d’affiner la sollicitation.

```text wrap
┌─💬 github:gpt-4.1 ✉ 2 ~↑1.4kt
┌─📙 system
│## Safety: Jailbreak
│... (85 lines)
│- **Do NOT use function names starting with 'functions.'.
│- **Do NOT respond with multi_tool_use**.
┌─👤 user
│<GIT_DIFF lang="diff">
│--- /dev/null
│+++ .github/workflows/genai-pr-review.yml
│@@ -0,0 +1,22 @@
│--- /dev/null
│[1] +++ genaisrc/.gitignore
│... (3 lines)
│Report errors in <GIT_DIFF> using the annotation format.
│- Use best practices of the programming language of each file.
│- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
│- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
│- Use tools to read the entire file content to get more context
│- Do not report warnings, only errors.


::error file=.github/workflows/genai-pr-review.yml,line=1,endLine=22,code=missing_workflow_content::The workflow file is empty or missing mandatory workflow keys like `name`, `on`, and `jobs`. Every GitHub Actions workflow file must specify at least these top-level keys to define triggers and jobs. See official docs: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

└─🏁  github:gpt-4.1 ✉ 2 3446ms ⇅ 1.9kt ↑1.6kt ↓223t 0.505¢
genaiscript: success
> 3446ms ↑1.6kt ↓223t 538.62t/s 0.505¢
  github:gpt-4.1-2025-04-14> 3446ms ↑1.6kt ↓223t 538.62t/s 0.505¢
   trace: ...
  output: ...
```

## Rendez-le Agentique

GenAIScript fournit plusieurs agents intégrés, y compris un agent pour le système de fichiers et un agent git.
Cela peut être utile pour que le LLM lise les fichiers dans la pull request et les analyse.

Il existe essentiellement deux niveaux d'agentivité que vous pouvez atteindre avec GenAIScript :

* ajoutez la [fs\_read\_file](../../reference/scripts/system/#systemfs_read_file/) pour lire les fichiers dans le script.

```ts title="genaisrc/prr.genai.mts" wrap 'tools: ["fs_read"]'
script({
    ...,
    tools: ["fs_read_file"],
})
```

* ajoutez l'[agent du système de fichiers](../../reference/scripts/system/#systemagent_fs/) qui peut répondre à des requêtes plus complexes au prix de tokens supplémentaires.

```ts title="genaisrc/prr.genai.mts" wrap 'tools: ["agent_fs"]'
script({
    ...,
    tools: ["agent_fs"],
})
```

## Automatiser avec GitHub Actions

En utilisant [GitHub Actions](https://docs.github.com/en/actions) et [GitHub Models](https://docs.github.com/en/github-models),
vous pouvez automatiser l'exécution du script et la création des commentaires.

* Ajoutez le workflow suivant dans votre dépôt GitHub.

```yaml title=".github/workflows/genai-pr-review.yml" wrap
name: genai pull request review
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
    review:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: "22"
            - name: fetch base branch
              run: git fetch origin ${{ github.event.pull_request.base.ref }}
            - name: genaiscript prr
              run: npx --yes genaiscript run prr --vars base=origin/${{ github.event.pull_request.base.ref }} --pull-request-reviews --pull-request-comment --out-trace $GITHUB_STEP_SUMMARY
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

La ligne de commande utilise deux options spéciales pour générer des commentaires et des revues de pull request :

* `--pull-request-reviews` pour générer des commentaires de revue de pull request à partir de chaque annotation,

* `--pull-request-comment` pour générer un commentaire global pour la pull request à partir de la sortie.

* Validez les modifications, créez une nouvelle pull request et commencez à tester le workflow en demandant une revue ou en déclenchant l’événement `ready_for_review`.

## Sécurité du contenu

Les mesures suivantes sont prises pour garantir la sécurité du contenu généré.

* Ce script inclut des invites système pour empêcher les injections de prompt et la génération de contenu nuisible.
  * [system.safety\_jailbreak](../../reference/scripts/system#systemsafety_jailbreak/)
  * [system.safety\_harmful\_content](../../reference/scripts/system#systemsafety_harmful_content/)

Des mesures supplémentaires pour renforcer la sécurité consisteraient à utiliser [un modèle avec un filtre de sécurité](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
ou à valider le message avec un [service de sécurité du contenu](../../reference/scripts/content-safety/).

Consultez la [Note de transparence](../../reference/transparency-note/) pour plus d’informations sur la sécurité du contenu.