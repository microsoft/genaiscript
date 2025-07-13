import { delay } from "@genaiscript/runtime";

let res = await github.updateReaction("issue", 1712, "heart");
console.log(res);
await delay(1000);
res = await github.updateReaction("issue", 1712, "eyes");
console.log(res);
await delay(1000);
