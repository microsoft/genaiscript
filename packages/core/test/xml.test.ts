import { XMLParse } from "../src/xml.js";
import { describe, test, assert } from "vitest";
import { dedent } from "../src/indent.js";

describe("xml", () => {
  test("parse elements", () => {
    const x = XMLParse("<root><a>1</a><b>2</b></root>");
    assert.deepStrictEqual(x, { root: { a: 1, b: 2 } });
  });
  test("parse elements fenced", () => {
    const x = XMLParse(
      dedent`
        \`\`\`xml
        <root><a>1</a><b>2</b></root>
        \`\`\`
        `,
    );
    assert.deepStrictEqual(x, { root: { a: 1, b: 2 } });
  });

  test("parse attribute", () => {
    const x = XMLParse('<root a="1"><b>2</b></root>');
    assert.deepStrictEqual(x, { root: { b: 2, "@_a": 1 } });
  });
});
