import { init } from "./src/llmstxt.mts";

script({
  accept: "none",
  description: "Downloads llms.txt entries and stores them in the vector database.",
});
const { output } = env;
const { docs, index } = await init();
output.heading(2, "indexing");
for (const [id, value] of Object.entries(docs)) {
  output.heading(3, id);
  const urls = Array.isArray(value) ? value : [value];
  for (const url of urls) {
    const { ok, text } = await host.fetchText(url);
    if (!ok) output.warn(`failed to fetch`);
    else if (text) {
      const content = text.replace(
        /^\!\[\]\(<data:image\/svg\+xml,.*$/gm,
        "<!-- mermaid diagram -->",
      );
      await index.insertOrUpdate({
        filename: id,
        content,
      });
    }
  }
}
