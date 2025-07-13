script({
  title: "summarize each files",
  model: "small",
  files: ["src/rag/markdown.md", "src/Earth.fst"],
  tests: [
    {
      files: "src/rag/markdown.md",
      keywords: "markdown",
    },
    {
      files: "src/Earth.fst",
      keywords: "green",
    },
  ],
});

def("FILE", env.files);

$`
Summarize each FILE with one paragraph.
- Do not wrap results in code section.
- Use less than 20 words.
`;
