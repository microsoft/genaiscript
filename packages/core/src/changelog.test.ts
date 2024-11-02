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

    test("documentor", () => {
        const source = `ChangeLog:1@packages/core/src/cancellation.ts
Description: Added comments to explain the purpose and functionality of the code.

OriginalCode@3-10:
[3] /**
[4]  * A cancellation token is passed to an asynchronous or long running
[5]  * operation to request cancellation, like cancelling a request
[6]  * for completion items because the user continued to type.
[7]  *
[8]  * To get an instance of a \`CancellationToken\` use a
[9]  * {@link CancellationTokenSource}.
[10]  */
ChangedCode@3-10:
[3] /**
[4]  * A cancellation token is passed to an asynchronous or long running
[5]  * operation to request cancellation, like cancelling a request
[6]  * for completion items because the user continued to type.
[7]  *
[8]  * To get an instance of a \`CancellationToken\` use a
[9]  * {@link CancellationTokenSource}.
[10]  * It helps manage and respond to user-initiated or programmatic cancellations.
[11]  */
OriginalCode@11-16:
[11] export interface CancellationToken {
[12]     /**
[13]      * Is \`true\` when the token has been cancelled, \`false\` otherwise.
[14]      */
[15]     isCancellationRequested: boolean
[16] }
ChangedCode@11-16:
[11] export interface CancellationToken {
[12]     /**
[13]      * Represents whether a cancellation has been requested.
[14]      * Is \`true\` when the token has been cancelled, \`false\` otherwise.
[15]      */
[16]     isCancellationRequested: boolean
[17] }
OriginalCode@18-23:
[18] export class AbortSignalCancellationToken implements CancellationToken {
[19]     constructor(private readonly signal: AbortSignal) {}
[20]     get isCancellationRequested() {
[21]         return this.signal.aborted
[22]     }
[23] }
ChangedCode@18-23:
[18] export class AbortSignalCancellationToken implements CancellationToken {
[19]     // Uses an AbortSignal to implement the CancellationToken interface
[20]     constructor(private readonly signal: AbortSignal) {}
[21]     // Getter that checks if the AbortSignal has been aborted
[22]     get isCancellationRequested() {
[23]         return this.signal.aborted
[24]     }
[25] }
OriginalCode@25-27:
[25] export function toSignal(token: CancellationToken) {
[26]     return (token as any)?.signal
[27] }
ChangedCode@25-27:
[25] export function toSignal(token: CancellationToken) {
[26]     // Attempts to cast the token to any type and access a signal property
[27]     return (token as any)?.signal
[28] }
OriginalCode@29-40:
[29] export class AbortSignalCancellationController {
[30]     readonly controller: AbortController
[31]     readonly token: AbortSignalCancellationToken
[32]     constructor() {
[33]         this.controller = new AbortController()
[34]         this.token = new AbortSignalCancellationToken(this.controller.signal)
[35]     }
[36] 
[37]     abort(reason?: any) {
[38]         this.controller.abort(reason)
[39]     }
[40] }
ChangedCode@29-40:
[29] export class AbortSignalCancellationController {
[30]     // Holds an AbortController and its associated token
[31]     readonly controller: AbortController
[32]     readonly token: AbortSignalCancellationToken
[33]     constructor() {
[34]         // Initializes a new AbortController and token
[35]         this.controller = new AbortController()
[36]         this.token = new AbortSignalCancellationToken(this.controller.signal)
[37]     }
[38] 
[39]     // Aborts the associated controller with an optional reason
[40]     abort(reason?: any) {
[41]         this.controller.abort(reason)
[42]     }
[43] }
OriginalCode@42-44:
[42] export function checkCancelled(token: CancellationToken) {
[43]     if (token?.isCancellationRequested) throw new CancelError("user cancelled")
[44] }
ChangedCode@42-44:
[42] export function checkCancelled(token: CancellationToken) {
[43]     // Throws a CancelError if the cancellation has been requested
[44]     if (token?.isCancellationRequested) throw new CancelError("user cancelled")
[45] }
OriginalCode@46-48:
[46] export interface CancellationOptions {
[47]     cancellationToken?: CancellationToken
[48] }
ChangedCode@46-48:
[46] export interface CancellationOptions {
[47]     // Optional CancellationToken for managing cancellation state
[48]     cancellationToken?: CancellationToken
[49] }`
        const res = parseChangeLogs(source)
        console.log(res)
        assert.equal(res[0].filename, "packages/core/src/cancellation.ts")
    })

    test("missing header", () => {
        const source = `
ChangeLog:1@src/edits/su/fib.ts
Description: Implement the Fibonacci function and remove comments and empty lines.
OriginalCode@105-107:
[105]     // TODO: implement fibonacci algorithm
[106]     return 0 // BODY
[107] }
ChangedCode@105-107:
[105]     if (n <= 1) return n;
[106]     return fibonacci(n - 1) + fibonacci(n - 2);
[107] }
`
        const res = parseChangeLogs(source)
        console.log(res)
        assert.equal(res[0].filename, "src/edits/su/fib.ts")
    })

    test("unbalancred fences", () => {
        const source = `\`\`\`\`\`changelog
ChangeLog:1@src/edits/bigfibs/fib.py
Description: Implemented new_function, removed comments and empty lines.
OriginalCode@48-51:
[48] def new_function(sum):
[49]     # TODO
[50]     return 0
[51]     # return (10 - (sum % 10)) % 10;
ChangedCode@48-50:
[48] def new_function(sum):
[49]     return (10 - (sum % 10)) % 10
[50] 
\`\`\`
`
        const res = parseChangeLogs(source)
        console.log(res)
        assert.equal(res[0].filename, "src/edits/bigfibs/fib.py")
    })

    /*
    test("missing ChangedCode Change", async () => {
        const source = `
\`\`\`\`\`changelog
ChangeLog:1@src/LLMFrontEnd.py
Description: Refactor \`fix_prompt\` to use \`render_prompt\` with a prompty template.
OriginalCode@265-305:
[265]     def fix_prompt(self, prompt, failed_tests):
[266]         Dbg.debug(f"[LLM FrontEnd][fix_prompt] fixing prompt with failed tests:\n {failed_tests}")
[267] 
[268]         system_prompt = """You are given a description of a task given to a person and instances of where this person made errors (question, answer and reason of incorrectness highlighting the error). This person is very smart so the reason of these failure must be in the instructions or the description of the task provided to this person. Your goal is to improve the description of task / instructions so that the person can correctly answer all the questions.
[269] 
[270] Follow these instructions for generating the fix:
[271] 1. Analyze the question, answer and the associated reason for each incorrect answer.
[272] 2. Since the person is very smart, you must connect the reason of failure to a rule or a constraint in the task description as the description is the only source of information for the person.
[273] 3. If the task description does not have a rule or a constraint related to the reason of incorrect, add a new rule or constraint to the task description. For example, if the reason of failure was the use of comma as delimiter in the answer but the task description did not specify the delimiter, then add a rule specifying the delimiter.
[274] 4. If the task description has a rule or a constraint already which is related to the incorrect answer, then analyze if falls in one of the following categories:
[275]     - The rule or constraint is not clear or have ambiguity. In this case, make the rule or constraint more clear and specific.
[276]     - The rule or constraint is not specific enough to handle this particular test (corner case). In this case, make the rule or constraint more specific while keeping it general enough to handle other cases.
[277]     - The rule or constraint is not comprehensive enough to handle a particular test. In this case, make the rule or constraint more comprehensive.
[278]     - The rule or constraint assumes context which is not provided in the task description. In this case, make the rule or constraint more general by adding the context to the task description.
[279]     - The task description can correctly handle the test but the answer is still incorrect. In this case, increase the specificity or emphasis of the rule or constraint in the description hoping it will fix the failed test cases.
[280] 
[281] The incorrect answers can only be corrected by modifying the task description. Please feel to try other techniques to fix the incorrect answers. Analyze each incorrect answer and reason step by step and generate a fix trying to fix all the incorrect answers not just one.
[282] 
[283] While generating the fix you must follow these guidelines:
[284] 1. Only add or remove a single sentence at a time to the task description to fix the incorrect answers.
[285] 2. Do not change the existing sentences in the task description unless necessary.
[286] 3. Do not add more examples to the task description especially to fix a particular incorrect answer.
[287] 4. Do not mention any specific question or answer in the task description as the task description must be general enough to handle all the questions.
[288] 5. Always address the question or test which will be given to the person as input.
[289] 
[290] First output the reasoning and analysis used in generating the fix, also output how did you follow the instruction and which of the above categories were involved in the incorrect answer and then output the fixed description. The fixed description must start with a heading "Fixed:" and then the fixed description without any other delimiter like \`\`\`.
[291] 
[292] Do not output anything after the fixed description.
[293] """
[294]         messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Here is the task:\n" + prompt + "\nHere are the incorrect answers:\n" + failed_tests}]
[295]         output = self.get_bot_response(messages)
[296]         if output is None:
[297]             return ""
[298]         output = output.split("**Fixed Description:**")[-1].strip()
[299]         output = output.split("Fixed Description:")[-1].strip()
[300]         output = output.split("Fixed Description")[-1].strip()
[301]         output = output.split("**Fixed:**")[-1].strip()
[302]         output = output.split("**Fixed**")[-1].strip()
[303]         output = output.split("Fixed:")[-1].strip()
[304]         output = output.split("Fixed")[-1].strip()
[305]         return output
ChangedCode@265-305:
[265]     def fix_prompt(self, prompt, failed_tests):
[266]         Dbg.debug(f"[LLM FrontEnd][fix_prompt] fixing prompt with failed tests:\n {failed_tests}")
[267] 
[268]         messages = render_prompt(
[269]             "fix_prompt",
[270]             prompt=prompt,
[271]             failed_tests=failed_tests
[272]         )
[273]         output = self.get_bot_response(messages)
[274]         if output is None:
[275]             return ""
[276]         output = output.split("**Fixed Description:**")[-1].strip()
[277]         output = output.split("Fixed Description:")[-1].strip()
[278]         output = output.split("Fixed Description")[-1].strip()
[279]         output = output.split("**Fixed:**")[-1].strip()
[280]         output = output.split("**Fixed**")[-1].strip()
[281]         output = output.split("Fixed:")[-1].strip()
[282]         output = output.split("Fixed")[-1].strip()
[283]         return output
\`\`\`\`
        `
        const res = parseChangeLogs(source)
        console.log(res)
    })

    test("missing ChangeLog header", () => {
        const source = `


CHANGELOG:
\`\`\`\`\`changelog
ChangeLog:1@src/LLMFrontEnd.py
Description: Refactor \`fix_prompt\` to use \`render_prompt\` instead of inline prompt.
OriginalCode@267-305:
[267]     def fix_prompt(self, prompt, failed_tests):
[268]         Dbg.debug(f"[LLM FrontEnd][fix_prompt] fixing prompt with failed tests:\n {failed_tests}")
[269] 
[270]         system_prompt = """You are given a description of a task given to a person and instances of where this person made errors (question, answer and reason of incorrectness highlighting the error). This person is very smart so the reason of these failure must be in the instructions or the description of the task provided to this person. Your goal is to improve the description of task / instructions so that the person can correctly answer all the questions.
[271] 
[272] Follow these instructions for generating the fix:
[273] 1. Analyze the question, answer and the associated reason for each incorrect answer.
[274] 2. Since the person is very smart, you must connect the reason of failure to a rule or a constraint in the task description as the description is the only source of information for the person.
[275] 3. If the task description does not have a rule or a constraint related to the reason of incorrect, add a new rule or constraint to the task description. For example, if the reason of failure was the use of comma as delimiter in the answer but the task description did not specify the delimiter, then add a rule specifying the delimiter.
[276] 4. If the task description has a rule or a constraint already which is related to the incorrect answer, then analyze if falls in one of the following categories:
[277]     - The rule or constraint is not clear or have ambiguity. In this case, make the rule or constraint more clear and specific.
[278]     - The rule or constraint is not specific enough to handle this particular test (corner case). In this case, make the rule or constraint more specific while keeping it general enough to handle other cases.
[279]     - The rule or constraint is not comprehensive enough to handle a particular test. In this case, make the rule or constraint more comprehensive.
[280]     - The rule or constraint assumes context which is not provided in the task description. In this case, make the rule or constraint more general by adding the context to the task description.
[281]     - The task description can correctly handle the test but the answer is still incorrect. In this case, increase the specificity or emphasis of the rule or constraint in the description hoping it will fix the failed test cases.
[282] 
[283] The incorrect answers can only be corrected by modifying the task description. Please feel to try other techniques to fix the incorrect answers. Analyze each incorrect answer and reason step by step and generate a fix trying to fix all the incorrect answers not just one.
[284] 
[285] While generating the fix you must follow these guidelines:
[286] 1. Only add or remove a single sentence at a time to the task description to fix the incorrect answers.
[287] 2. Do not change the existing sentences in the task description unless necessary.
[288] 3. Do not add more examples to the task description especially to fix a particular incorrect answer.
[289] 4. Do not mention any specific question or answer in the task description as the task description must be general enough to handle all the questions.
[290] 5. Always address the question or test which will be given to the person as input.
[291] 
[292] First output the reasoning and analysis used in generating the fix, also output how did you follow the instruction and which of the above categories were involved in the incorrect answer and then output the fixed description. The fixed description must start with a heading "Fixed:" and then the fixed description without any other delimiter like \`\`\`.
[293] 
[294] Do not output anything after the fixed description.
[295] """
[296]         messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Here is the task:\n" + prompt + "\nHere are the incorrect answers:\n" + failed_tests}]
[297]         output = self.get_bot_response(messages)
[298]         if output is None:
[299]             return ""
[300]         output = output.split("**Fixed Description:**")[-1].strip()
[301]         output = output.split("Fixed Description:")[-1].strip()
[302]         output = output.split("Fixed Description")[-1].strip()
[303]         output = output.split("**Fixed:**")[-1].strip()
[304]         output = output.split("**Fixed**")[-1].strip()
[305]         output = output.split("Fixed:")[-1].strip()
ChangedCode@267-272:
[267]     def fix_prompt(self, prompt, failed_tests):
[268]         Dbg.debug(f"[LLM FrontEnd][fix_prompt] fixing prompt with failed tests:\n {failed_tests}")
[269] 
[270]         messages = render_prompt("fix_prompt", task=prompt, failed_tests=failed_tests)
[271]         output = self.get_bot_response(messages)
[272]         if output is None:
ChangedCode@297-306:
[297]             return ""
[298]         output = output.split("**Fixed Description:**")[-1].strip()
[299]         output = output.split("Fixed Description:")[-1].strip()
[300]         output = output.split("Fixed Description")[-1].strip()
[301]         output = output.split("**Fixed:**")[-1].strip()
[302]         output = output.split("**Fixed**")[-1].strip()
[303]         output = output.split("Fixed:")[-1].strip()
[304]         output = output.split("Fixed")[-1].strip()
[305]         return output
\`\`\`\`\`
        
        `
        const res = parseChangeLogs(source)
        console.log(res)
    })
        */
})
