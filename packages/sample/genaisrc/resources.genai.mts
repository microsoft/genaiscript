import { randomBytes } from "node:crypto";

script({
  accept: "none",
  files: ["src/rag/*.md", "src/*.jpg"],
  group: "mcp",
});
let id = await host.publishResource("string", "This is just a string");
env.output.item(id);

id = await host.publishResource("rnd", randomBytes(32));
env.output.item(id);

id = await host.publishResource("fn", {
  filename: "https://microsoft.github.io/genaiscript/llms-full.txt",
});
env.output.item(id);

for (const file of env.files) {
  id = await host.publishResource(file.filename, file);
  env.output.item(id);
}

env.output.heading(3, "resources");
for (const res of await host.resources()) env.output.itemValue(res.name, res.uri);
