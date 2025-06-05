// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { INIParse, INIStringify } from "../src/ini.js";
import { dedent } from "../src/indent.js";

describe("ini", () => {
  test("rountrip", () => {
    const o = { a: "1", b: "foo" };
    const text = INIStringify(o);
    const r = INIParse(text);

    assert.equal(JSON.stringify(r), JSON.stringify(o));
  });
  test("fenced", () => {
    const o = { a: "1", b: "foo" };
    const text = dedent`
        \`\`\`ini
        ${INIStringify(o)}
        \`\`\`
        `;
    console.log(text);
    const r = INIParse(text);

    assert.equal(JSON.stringify(r), JSON.stringify(o));
  });
});
