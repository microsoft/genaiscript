// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { isQuiet, setQuiet } from "../src/quiet.js";

describe("quiet mode", () => {
  let originalQuiet: boolean;

  beforeEach(() => {
    originalQuiet = isQuiet;
  });

  afterEach(() => {
    setQuiet(originalQuiet);
  });

  test("setQuiet updates isQuiet flag", () => {
    setQuiet(true);
    expect(isQuiet).toBe(true);
    
    setQuiet(false);
    expect(isQuiet).toBe(false);
  });

  test("isQuiet defaults to false", () => {
    setQuiet(false);
    expect(isQuiet).toBe(false);
  });
});