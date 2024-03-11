---
title: Annotations
sidebar:
    order: 11
---

Annotations are errors, warning or notes that can be added to the LLM output. They are extracted and injected in VSCode or your CI environment.


```js "annotations"
$`Report issues with this code using annotations.`
```

## Configuration

Using the `system.annotations` system prompt, you can have the LLM generate errors, warnings and notes.

:::tip

If you use `annotation` in your script and you do not specify the `system` script, `system.annotations` will be added by default.

:::

## Static Analysis Results Interchange Format (SARIF)

GenAIScript will convert those into SARIF files that can be uploaded to GitHub Actions as security reports, similarly to CodeQL reports.

The [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
extension can be used to visualize the reports.

```yaml title="GitHub Action"
    - name: Run GenAIScript
      run: node .genaiscript/genaiscript.cjs ... -oa result.sarif
    - name: Upload SARIF file
        if: success() || failure()
        uses: github/codeql-action/upload-sarif@v3
        with:
            sarif_file: result.sarif
```
