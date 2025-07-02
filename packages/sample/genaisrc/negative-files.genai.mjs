script({
  files: ["src/rag/*.md", "!src/rag/markdown*"],
  model: "none",
});

if (env.files.find(({ filename }) => filename.includes("markdown"))) {
  console.log(env.files.map(({ filename }) => filename));
  throw new Error("File should not be included");
}
