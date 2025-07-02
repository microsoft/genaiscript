script({
  model: "small",
  files: "src/rag/*",
  tests: {
    files: "src/rag/*",
    keywords: ["lorem"],
  },
});

const chunks = await retrieval.vectorSearch("lorem", env.files);
console.log(`Found ${chunks.length} chunks.`);
def("FILES", chunks);

$`Summarize FILES. Use one short sentence.`;
