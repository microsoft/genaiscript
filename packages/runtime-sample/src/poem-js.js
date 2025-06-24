import { config } from "@genaiscript/runtime";

await config();

const d = YAML`foo: bar`;

const res = await prompt`write a poem`;
console.log(res.text);
