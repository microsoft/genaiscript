script({
  model: "small",
  files: "src/rag/*",
  tests: {
    files: "src/rag/*",
    keywords: ["lorem"],
  },
});

const index = await retrieval.index("docs", { type: "azure_ai_search", cacheSalt: "1" });
await index.insertOrUpdate(env.files);
const chunks = await index.search("lorem");
console.log(`Found ${chunks.length} chunks.`);

def("FILES", chunks);
$`Summarize FILES. Use one short sentence.`;
