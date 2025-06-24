import { prompt } from "@genaiscript/runtime";

const res = await prompt`write a poem`;
console.log(res.text);
