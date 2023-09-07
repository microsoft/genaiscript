# General CoArch Prompt Critic

This file uses a CoArch prompt to generate a critique of a generic prompt.
This file contains 2 subsections, a description of the goals of the prompt and the prompt itself.
When run over this file, Coarch prompt-critic will generate a critique of the prompt and suggest a better one.

## Goals of this prompt

- The prompt should inform the model to generate the best high-quality tests for the code under development.
- Assume that the names CODE, TASK, and TESTS are references to other files that are resolved when given to the model.
- The tests should cover both common and edge cases.

## The Prompt

Python has been written for the task in TASK. The code is in CODE.
Generate 5 tests for the code in CODE in a separate file.
Do not modify or duplicate the code in CODE.
If the tests are already present in TESTS, ensure that the tests
match the description in TASK and the code in CODE.  If they do not,
update the tests to match the code and the description.

Include a test harness that can run the tests from the command line
Ensure that the result is well-formed Python code`