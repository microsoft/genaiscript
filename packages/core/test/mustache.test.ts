// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { interpolateVariables } from "../src/mustache.js";

describe("interpolateVariables", () => {
  test("should interpolate variables correctly in markdown", async () => {
    const md = `---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
model:
    api: chat
    configuration:
        type: azure_openai
        azure_deployment: gpt-4o
    parameters:
        max_tokens: 128
        temperature: 0.2
inputs:
  question:
    type: string
sample:
  "question": "Who is the most famous person in the world?"
---
system:
You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly. 

user:
{{question}}`;
    const expectedOutput = `Hello, John Doe. You are 30 years old.`; // Assume this is the correct interpolation
    const output = await interpolateVariables(md, {
      question: "THE QUESTION",
    });
    assert.strictEqual(
      output,
      `

You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly. 


THE QUESTION`,
    );
  });
  test("should interpolate jinja variables when format is jinja", async () => {
    const md = `---
name: Jinja Template Test
---
Hello {{ name }}! Your age is {{ age }}.`;

    const output = await interpolateVariables(
      md,
      {
        name: "Alice",
        age: 25,
      },
      { format: "jinja" },
    );

    assert.strictEqual(output, "Hello Alice! Your age is 25.");
  });

  test("should handle jinja conditionals", async () => {
    const md = `---
name: Jinja Conditional Test
---
{% if age >= 18 %}You are an adult.{% else %}You are a minor.{% endif %}`;

    const adultOutput = await interpolateVariables(
      md,
      {
        age: 25,
      },
      { format: "jinja" },
    );

    assert.strictEqual(adultOutput, "You are an adult.");

    const minorOutput = await interpolateVariables(
      md,
      {
        age: 15,
      },
      { format: "jinja" },
    );

    assert.strictEqual(minorOutput, "You are a minor.");
  });

  test("should handle jinja loops", async () => {
    const md = `---
name: Jinja Loop Test
---
Items:
{% for item in items %}
- {{ item }}
{% endfor %}`;

    const output = await interpolateVariables(
      md,
      {
        items: ["apple", "banana", "cherry"],
      },
      { format: "jinja" },
    );

    assert.strictEqual(output, "Items:\n- apple\n- banana\n- cherry\n");
  });
});
