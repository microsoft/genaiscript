import { prompt } from "@genaiscript/runtime";

const d = YAML`foo: bar`;

const res = await prompt`write a poem`;
console.log(res.text);
