import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { astGrepFindFiles, astGrepParse } from "./astgrep";
import { TestHost } from "./testhost";
import { dedent } from "./indent";

describe("astgrep", () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("finds matches in files", async () => {
    console.log("Hello, world!");
    const result = await astGrepFindFiles("ts", "src/astgrep.test.ts", "console.log($GREETING)");
    assert.equal(result.files, 1);
    assert(result.matches.length > 0);
  });
  test("parses a JavaScript file", async () => {
    const file: WorkspaceFile = {
      filename: "test.js",
      content: "const x = 1;",
    };
    const result = await astGrepParse(file, { lang: "js" });
    assert(result);
  });

  test("returns undefined for binary file", async () => {
    const file: WorkspaceFile = {
      filename: "test.bin",
      encoding: "base64",
    };
    const result = await astGrepParse(file, { lang: "js" });
    assert.equal(result, undefined);
  });

  test("parse C++ file", async () => {
    const file: WorkspaceFile = {
      filename: "test.cpp",
      content: dedent`
            #include <iostream>
            
            int main() {
                std::cout << 'Hello, world!' << std::endl;
                return 0;
            }
            `,
    };
    const result = await astGrepParse(file);
    assert(result);
  });
  test("parse TypeScript file", async () => {
    const file: WorkspaceFile = {
      filename: "test.ts",
      content: "const x: number = 1;",
    };
    const result = await astGrepParse(file);
    assert(result);
  });
  test("parse python file", async () => {
    const file: WorkspaceFile = {
      filename: "test.py",
      content: "x = 1",
    };
    const result = await astGrepParse(file);
    assert(result);
  });
  test("parse C file", async () => {
    const file: WorkspaceFile = {
      filename: "test.c",
      content: "#include <stdio.h>",
    };
    const result = await astGrepParse(file);
    assert(result);
  });
});
