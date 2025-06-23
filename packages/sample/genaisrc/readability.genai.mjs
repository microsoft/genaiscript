import { parseReadableContent } from "@genaiscript/runtime";

const page = await host.browse("https://www.msn.com/en-ca", {
  waitUntil: "networkidle",
});
const content = await parseReadableContent(page);
console.log(content);
if (!content.title) throw new Error("No title found");
