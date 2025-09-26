import { PackageManagers } from "starlight-package-managers";

[Z3](https://microsoft.github.io/z3guide/) is a high-performance theorem prover developed at Microsoft Research. It is a built-in tool of GenAIScript. Z3 is used to solve logical formulas
and can be used for various applications, including program verification, constraint solving, and symbolic execution.

GenAIScript uses the WebAssembly-based [z3-solver](https://www.npmjs.com/package/z3-solver) npm package to run Z3.

## Installation

<PackageManagers pkg="@genaiscript/plugin-z3" dev />

If you are using the plugin in a Node.JS environment, without a `.genai...` entry file, you will need
to initialize the [runtime](/genaiscript/reference/runtime) before using the plugin:

```ts
import { initialize } from "@genaiscript/runtime";

await initialize();
```

## Z3 instance

The `z3()` method creates a new Z3 instance. The instance can be used to run Z3 commands and get the results.
The `z3` instance is a wrapper around the [z3-solver](https://www.npmjs.com/package/z3-solver) npm package.
The `z3` instance has the `run` method that runs the given SMTLIB2 formula and returns the result.

```js
import { z3 } from "@genaiscript/plugin-z3";

const z3 = await z3();
const res = await z3.run(`
(declare-const a Int)
(declare-fun f (Int Bool) Int)
(assert (< a 10))
(assert (< (f a true) 100))
(check-sat)
`);
console.log(res); // unsat
```

## Z3 tool

The `z3` tool plugin wraps Z3 as a LLM tool that can be used in GenAIScript.
The tool takes a SMTLIB2 formula as input and returns the Z3 output.

```js
import z3 from "@genaiscript/plugin-z3"

z3(env)

$`Solve the following problems using Z3:

(declare-const a Int)
(declare-fun f (Int Bool) Int)
(assert (< a 10))
(assert (< (f a true) 100))
(check-sat)
```

The tool won't handle arbitrary problems, which takes us to the agent.

### Z3 agent

The `z3` agent (in [system.agent-z3](/genaiscript/reference/scripts/system#systemagent_z3)) script wraps the `z3`
tool with a LLM that can (try to) formalize arbitrary problems to SMTLIB2.

```js
script({
  tools: ["agent_z3"],
});

$`Solve the following problems using Z3:

Imagine we have a number called 'a' that is smaller than 10. 
We also have a special machine called 'f' that takes a number and a 'true'/'false' answer, 
and it gives back another number. 
When we put the number 'a' and the answer “true” into this machine, 
the number it gives us is smaller than 100.`;
```

:::note

The LLM conversation from the problem to the SMTLIB2 formula might be incorrect.
Verify your results with the Z3 tool.
The agent is not a replacement for the Z3 tool, but a way to use Z3 with arbitrary problems.

:::