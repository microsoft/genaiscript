import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { parseChangeLogs } from "./changelog"

describe("changelog", () => {
    test("template", () => {
        const source = `ChangeLog:1@<file1>
Description: <summary1>.
OriginalCode@4-6:
[4] <white space> <original code line>
[5] <white space> <original code line>
[6] <white space> <original code line>
ChangedCode@4-6:
[4] <white space> <changed code line>
[5] <white space> <changed code line>
[6] <white space> <changed code line>
OriginalCode@9-10:
[9] <white space> <original code line>
[10] <white space> <original code line>
ChangedCode@9-9:
[9] <white space> <changed code line>
ChangeLog:2@<file2>
Description: <summary2>.
OriginalCode@15-16:
[15] <white space> <original code line>
[16] <white space> <original code line>
ChangedCode@15-17:
[15] <white space> <changed code line>
[16] <white space> <changed code line>
[17] <white space> <changed code line>
OriginalCode@23-23:
[23] <white space> <original code line>
ChangedCode@23-23:
[23] <white space> <changed code line>`
        const res = parseChangeLogs(source)
        assert.equal(res.length, 2)
        assert.equal(res[0].filename, "<file1>")
        assert.equal(res[1].filename, "<file2>")
        assert.equal(res[0].changes.length, 2)
        assert.equal(res[1].changes.length, 2)
    })

    test("url", () => {
        const source = `ChangeLog:1@email_validator.py
Description: Implement a function to validate both email addresses and URLs.
OriginalCode@1-3:
[1] # Placeholder for email validation logic
[2] 
[3] # Placeholder for URL validation logic
ChangedCode@1-10:
[1] import re
[2] 
[3] def validate_email(email):
[4]     # Simple regex pattern for validating an email address
[5]     pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
[6]     return re.match(pattern, email) is not None
[7] 
[8] def validate_url(url):
[9]     # Simple regex pattern for validating a URL
[10]     pattern = r'^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}.*$'
[11]     return re.match(pattern, url) is not None
[12] 
[13] def validate_email_and_url(email, url):
[14]     return validate_email(email) and validate_url(url)
`
        const res = parseChangeLogs(source)
        assert.equal(res.length, 1)
        assert.equal(res[0].filename, "email_validator.py")
    })

    test("annotations", () => {
        const source = `
ChangeLog:1@annotations.md
Description: Corrected grammatical errors and enhanced technical language.
OriginalCode@9-9:
[9] Annotations are errors, warning or notes that can be added to the LLM output. They are extracted and injected in VSCode or your CI environment.
ChangedCode@9-9:
[9] Annotations are markers such as errors, warnings, or notes that can be incorporated into LLM output. They can be extracted and integrated into VSCode or CI environments.

OriginalCode@17-19:
[17] If you use \`annotation\` in your script text and you do not specify the \`system\` field, \`system.annotations\` will be added by default.
[18] 
[19] Using the \`system.annotations\` system prompt, you can have the LLM generate errors, warnings and notes.
ChangedCode@17-19:
[17] If you include \`annotation\` in your script text without specifying the \`system\` field, \`system.annotations\` will be appended by default.
[18] 
[19] Utilizing the \`system.annotations\` system prompt enables the LLM to generate errors, warnings, and notes.

OriginalCode@30-31:
[30] The \`system.annotations\` prompt automatically enables line number injection for all \`def\` section. This helps
[31] with the precision of the LLM answer and reduces hallucinations.
ChangedCode@30-31:
[30] The \`system.annotations\` prompt automatically facilitates line number injection for all \`def\` sections, which
[31] enhances the accuracy of the LLM's responses and mitigates the occurrence of hallucinations.

OriginalCode@40-41:
[40] The annotation are converted into Visual Studio **Diagnostics** which are presented to the user
[41] through the **Problems** panel. The diagnostics will also appear as squiggly lines in the editor.
ChangedCode@40-41:
[40] Annotations are transformed into Visual Studio **Diagnostics**, presented to the user
[41] via the **Problems** panel. These diagnostics are also indicated by squiggly lines within the editor.

OriginalCode@45-48:
[45] GenAIScript will convert those into SARIF files that can be [uploaded](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) as [security reports](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), similarly to CodeQL reports.
[46] 
[47] The [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
[48] extension can be used to visualize the reports.
ChangedCode@45-48:
[45] GenAIScript converts these annotations into SARIF files, which can be [uploaded](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) as [security reports](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), akin to CodeQL reports.
[46] 
[47] To visualize these reports, one can utilize the [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
[48] extension.

OriginalCode@85-88:
[85] -   Access to security reports may vary based on your repository visibilty and organization
[86]     rules. See [GitHub Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository#granting-access-to-security-alerts) for more help.
[87] -   Your organization may restrict the execution of GitHub Actions on Pull Requests.
[88]     See [GitHub Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#about-github-actions-permissions-for-your-repository) for more help.
ChangedCode@85-88:
[85] -   Access to security reports may vary depending on your repository's visibility and organizational
[86]     policies. Refer to the [GitHub Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository#granting-access-to-security-alerts) for further assistance.
[87] -   Your organization may impose restrictions on the execution of GitHub Actions for Pull Requests.
[88]     Consult the [GitHub Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#about-github-actions-permissions-for-your-repository) for additional guidance.
        `  
        const res = parseChangeLogs(source)
        assert.equal(res.length, 1)
        assert.equal(res[0].changes.length, 6)
    })
  
})
