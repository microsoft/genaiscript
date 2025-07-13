// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { jinjaRender } from "../src/jinja.js";
import { describe, test, assert } from "vitest";

describe("jinjaRender", () => {
  test("should correctly render template with values", () => {
    // Given a template and values
    const template = "Hello, {{ name }}! Today is {{ day }}.";
    const values = { name: "Alice", day: "Monday" };

    // When rendering the template
    const result = jinjaRender(template, values);

    // Then the result should be as expected
    const expected = "Hello, Alice! Today is Monday.";
    assert.strictEqual(result, expected);
  });
});
