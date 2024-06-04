---
title: Annotations
description: Learn how to add annotations such as errors, warnings, or notes to LLM output for integration with VSCode or CI environments.
keywords: annotations, LLM output, VSCode integration, CI environment, GitHub Actions
sidebar:
    order: 11
---

Annotations are errors, warnings, or notes that can be added to the LLM output. They are extracted and integrated into VSCode or your CI environment.

```js "annotations"
$`Report issues with this code using annotations.`
```

## Configuration

If you use `annotation` in your script text without specifying the `system` field, `system.annotations` will be added by default.

Utilizing the `system.annotations` system prompt enables the LLM to generate errors, warnings, and notes.

```js ""system.annotations""
script({
    ...
    system: [..., "system.annotations"]
})
```

### Line numbers

The `system.annotations` prompt automatically enables line number injection for all `def` sections. This enhances
the precision of the LLM's responses and reduces the likelihood of hallucinations.

## GitHub Action Commands

By default, the annotations use the [GitHub Action Commands](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message) syntax.
This means that the annotations will automatically be extracted by GitHub if you run your script in a GitHub Action.

## Github Pull Request Review Comments

Use the `--pull-request-review-comment` flag on the [cli](/genaiscript/reference/cli/run/) to add annotations as review comments on a pull request.

```sh "cli"
npx --yes genaiscript run ... --pull-request-review-comment
```

## Visual Studio Code Programs

Annotations are converted into Visual Studio **Diagnostics**, which are presented to the user
through the **Problems** panel. These diagnostics also manifest as squiggly lines in the editor.

## Static Analysis Results Interchange Format (SARIF)

GenAIScript converts these annotations into SARIF files, which can be [uploaded](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) as [security reports](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), akin to CodeQL reports.

The [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
extension facilitates the visualization of these reports.

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

-   Access to security reports may vary based on your repository visibility and organizational
    rules. Refer to the [GitHub Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository#granting-access-to-security-alerts) for further assistance.
-   Your organization may impose restrictions on the execution of GitHub Actions for Pull Requests.
    Consult the [GitHub Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#about-github-actions-permissions-for-your-repository) for additional guidance.

## Filtering

You can use the [defOutput](/genaiscript/reference/scripts/custom-output/) function
to filter the annotations.

```js "defOutput"
defOutputProcessor((annotations) => {
    // only allow errors
    const errors = annotations.filter(({ level }) => level === "error")
    return { annotations: errors }
})
```
