import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { parseLLMDiffs } from "./diff"

describe("diff", () => {
    test("is_valid_email", () => {
        const source = `[1] import re
[2] 
[3] def is_valid_email(email):
- [4]     if re.fullmatch(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", email):
+ [4]     pattern = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
+ [5]     if pattern.fullmatch(email):
[6]         return True
[7]     else:
[8]         return False`
        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 4)
    })

    test("missing line numbers", () => {
        const source = `
[10] CONSTANT
-     \* @type: XXX;
+     \* @type: Int;
[15] VARIABLES
-     \* @type: [Node -> XXX];
+     \* @type: [Node -> Bool];
-     \* @type: [Node -> XXX];
+     \* @type: [Node -> Str];
-     \* @type: XXX;
+     \* @type: Int;
-     \* @type: XXX;
+     \* @type: Str;
`

        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 12)
    })

    test("missing line numbers 2", () => {
        const source = `
[17] CONSTANTS
-     \* @type: ???;
+     \* @type: Int;
[19]     N,
-     \* @type: ???;
+     \* @type: Int;
[21]     T,
-     \* @type: ???;
+     \* @type: Int;
[23]     F
[28] VARIABLE 
-   \* @type: ???;
+   \* @type: Str -> Str;
[30]   pc,
-   \* @type: ???;
+   \* @type: Str -> Set(<<Int, Str>>);
[32]   rcvd,
-   \* @type: ???;
+   \* @type: Set(<<Int, Str>>);
[34]   sent
`

        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 19)
    })

    test("source same as added", () => {
        const source = `[9] Annotations are errors, warning or notes that can be added to the LLM output. They are extracted and injected in VSCode or your CI environment.
+ Annotations are errors, warnings, or notes that can be added to the LLM output. They are extracted and injected into VSCode or your CI environment.
[30] The \`system.annotations\` prompt automatically enables line number injection for all \`def\` section. This helps
- [31] with the precision of the LLM answer and reduces hallucinations.
+ [31] with the precision of the LLM answer and reduces the likelihood of hallucinations.
[40] The annotation are converted into Visual Studio **Diagnostics** which are presented to the user
+ The annotations are converted into Visual Studio **Diagnostics**, which are presented to the user
[45] GenAIScript will convert those into SARIF files that can be [uploaded](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) as [security reports](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), similarly to CodeQL reports.
+ GenAIScript will convert these into SARIF files that can be [uploaded](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) as [security reports](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning), similar to CodeQL reports.
[75]       # Upload the generate SARIF file to GitHub
+       # Upload the generated SARIF file to GitHub
[85] -   Access to security reports may vary based on your repository visibilty and organization
+ [85] -   Access to security reports may vary based on your repository visibility and organization
[87] -   Your organization may restrict the execution of GitHub Actions on Pull Requests.
+ [87] -   Your organization may restrict the execution of GitHub Actions on pull requests.
[92] You can use the [defOutput](/genaiscript/reference/scripts/custom-output/) function
- [93] to filter the annotations.
+ [93] to filter annotations.`
        const chunks = parseLLMDiffs(source)
        assert.equal(chunks.length, 18)
    })
})
