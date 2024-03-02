---
title: Annotations
sidebar:
  order: 11
---

Using the `system.annotations` system prompt, you can have the LLM generate errors, warnings and notes.
GenAIScript will convert those into SARIF files that can be uploaded to GitHub Actions as security reports, similarly to CodeQL reports. 
## Static Analysis Results Interchange Format (SARIF)

The [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
The [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
extension can be used to visualize the reports.

```yaml
# workflow.yml
    - name: Run GenAIScript
      run: node .genaiscript/genaiscript.cjs ... -oa result.sarif
    - name: Upload SARIF file
        if: success() || failure()
        uses: github/codeql-action/upload-sarif@v3
        with:
            sarif_file: result.sarif
```
