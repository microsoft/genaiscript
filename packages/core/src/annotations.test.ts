import test, { beforeEach, describe } from "node:test";
import {
  convertAnnotationsToItems,
  convertDiagnosticToGitHubActionCommand,
  convertGithubMarkdownAnnotationsToItems,
  parseAnnotations,
} from "./annotations";
import assert from "assert/strict";
import { TestHost } from "./testhost";
import { EMOJI_WARNING, EMOJI_FAIL } from "./constants";

describe("annotations", () => {
  beforeEach(() => {
    TestHost.install();
  });
  test("github", () => {
    const output = `
::error file=packages/core/src/github.ts,line=71,endLine=71,code=concatenation_override::The change on line 71 may lead to the original \`text\` content being overridden instead of appending the footer. Consider using \`text = appendGeneratedComment(script, info, text)\` to ensure the original text is preserved and the footer is appended. 😇

::error file=packages/core/src/github.ts,line=161,endLine=161,code=concatenation_override::Similarly to the change on line 71, the change on line 161 could override the original \`body\` content. It's safer to use \`body = appendGeneratedComment(script, info, body)\` to append the footer while keeping the existing content intact. 🤔

::error file=packages/core/src/github.ts,line=140,endLine=141,code=unused_code::The removal of the footer in the \`appendGeneratedComment\` function on lines 140-141 results in unused code. Since \`generatedByFooter\` is now being used to append the footer, the original lines that added the footer in \`appendGeneratedComment\` should be removed to clean up the code. 🧹        
        `;

    const diags = parseAnnotations(output);
    // console.log(diags)
    assert.strictEqual(diags.length, 3);
    assert.strictEqual(diags[0].severity, "error");
    assert.strictEqual(diags[0].filename, "packages/core/src/github.ts");
    assert.strictEqual(diags[0].range[0][0], 70);
    assert.strictEqual(diags[0].range[1][0], 70);
    assert.strictEqual(diags[0].code, "concatenation_override");
    assert.strictEqual(
      diags[0].message,
      "The change on line 71 may lead to the original `text` content being overridden instead of appending the footer. Consider using `text = appendGeneratedComment(script, info, text)` to ensure the original text is preserved and the footer is appended. 😇",
    );
  });

  test("github:suggestions", () => {
    const output = `
::warning file=packages/sample/src/fib.ts,line=1,endLine=4,code=unimplemented_function::The fibonacci function is unimplemented and currently always returns 0.::function fibonacci(n: number): number { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }
`;
    const diags = parseAnnotations(output);
    assert.strictEqual(diags.length, 1);
    assert.strictEqual(
      diags[0].suggestion,
      "function fibonacci(n: number): number { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }",
    );
  });

  test("tsc", () => {
    const output = `
$ /workspaces/genaiscript/node_modules/.bin/tsc --noEmit --pretty false -p src
src/annotations.ts:11:28 - error TS1005: ',' expected.
        `;

    const diags = parseAnnotations(output);
    // console.log(diags)
    assert.strictEqual(diags.length, 1);
    assert.strictEqual(diags[0].severity, "error");
    assert.strictEqual(diags[0].filename, "src/annotations.ts");
    assert.strictEqual(diags[0].range[0][0], 10);
    assert.strictEqual(diags[0].range[1][0], 27);
    assert.strictEqual(diags[0].code, "TS1005");
    assert.strictEqual(diags[0].message, "',' expected.");
  });

  test("tsc2", () => {
    const output = `
$ /workspaces/genaiscript/node_modules/.bin/tsc --noEmit --pretty false -p src
src/connection.ts(69,9): error TS1005: ')' expected.
src/connection.ts(71,5): error TS1128: Declaration or statement expected.
src/connection.ts(71,6): error TS1128: Declaration or statement expected.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.        
        `;
    const diags = parseAnnotations(output);
    assert.strictEqual(diags.length, 3);
    assert.strictEqual(diags[0].severity, "error");
    assert.strictEqual(diags[0].filename, "src/connection.ts");
    assert.strictEqual(diags[0].range[0][0], 68);
    assert.strictEqual(diags[0].code, "TS1005");
    assert.strictEqual(diags[0].message, "')' expected.");
    assert.strictEqual(diags[1].severity, "error");
    assert.strictEqual(diags[1].filename, "src/connection.ts");
    assert.strictEqual(diags[1].range[0][0], 70);
  });

  test("convertAnnotationsToItems", () => {
    const input = `
::warning file=src/greeter.ts,line=2,endLine=2,code=missing_semicolon::Missing semicolon after property declaration.
::warning file=src/greeter.ts,line=5,endLine=5,code=missing_semicolon::Missing semicolon after assignment.
::warning file=src/greeter.ts,line=9,endLine=9,code=missing_semicolon::Missing semicolon after return statement.
::warning file=src/greeter.ts,line=18,endLine=18,code=empty_function::The function 'hello' is empty and should contain logic or be removed if not needed.
::warning file=src/greeter.ts,line=20,endLine=20,code=missing_semicolon::Missing semicolon after variable declaration.
    `;
    const output = convertAnnotationsToItems(input);
    console.log(output);
  });

  test("convertDiagnosticToGitHubActionCommand", () => {
    const testCases = [
      {
        diagnostic: {
          severity: "info",
          filename: "src/test.ts",
          range: [
            [10, 0],
            [10, 25],
          ],
          message: "This is an informational message",
        },
        expected:
          "::notice file=src/test.ts, line=10, endLine=10::This is an informational message",
      },
      {
        diagnostic: {
          severity: "warning",
          filename: "src/component.tsx",
          range: [
            [5, 2],
            [8, 15],
          ],
          message: "Consider using a more specific type",
        },
        expected:
          "::warning file=src/component.tsx, line=5, endLine=8::Consider using a more specific type",
      },
      {
        diagnostic: {
          severity: "error",
          filename: "packages/core/utils.js",
          range: [
            [42, 0],
            [42, 30],
          ],
          code: "TS2322",
          message: "Type 'string' is not assignable to type 'number'",
        },
        expected:
          "::error file=packages/core/utils.js, line=42, endLine=42::Type 'string' is not assignable to type 'number'",
      },
    ];

    for (const { diagnostic, expected } of testCases) {
      const result = convertDiagnosticToGitHubActionCommand(diagnostic as Diagnostic);
      assert.strictEqual(result, expected);
    }
  });

  test("convertGithubMarkdownAnnotationsToItemsCaution", () => {
    const input = `> [!CAUTION]
> This operation cannot be undone.
`;

    const expected = `- ${EMOJI_FAIL} This operation cannot be undone.
`;

    const result = convertGithubMarkdownAnnotationsToItems(input);
    assert.strictEqual(result, expected);
  });

  test("convertGithubMarkdownAnnotationsToItems", () => {
    const input = `
> [!WARNING]
> This component will be deprecated in the next major version.

Some normal text here.

> [!NOTE]
> Remember to update your dependencies.
`;

    const expected = `- ${EMOJI_WARNING} This component will be deprecated in the next major version.

Some normal text here.
- ℹ️ Remember to update your dependencies.
`;

    const result = convertGithubMarkdownAnnotationsToItems(input);
    assert.strictEqual(result, expected);
  });

  test("convertGithubMarkdownAnnotationsToItems2", () => {
    const input = `
> [!WARNING]
> This component will be deprecated in the next major version.

Some normal text here.

> [!NOTE]
> Remember to update your dependencies.

> [!CAUTION]
> This operation cannot be undone.
`;

    const expected = `- ${EMOJI_WARNING} This component will be deprecated in the next major version.

Some normal text here.
- ℹ️ Remember to update your dependencies.
- ${EMOJI_FAIL} This operation cannot be undone.
`;

    const result = convertGithubMarkdownAnnotationsToItems(input);
    assert.strictEqual(result, expected);
  });
});
