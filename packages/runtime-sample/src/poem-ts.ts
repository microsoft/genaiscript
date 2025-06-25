import { config } from "@genaiscript/runtime";
await config();

const res = await prompt`write a poem`.options({ model: "github:openai/gpt-4o" });
console.log(res.text);
