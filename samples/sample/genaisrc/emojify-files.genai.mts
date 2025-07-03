script({
  title: "Converts each file to an emoji",
  files: ["src/*.txt", "src/*.cpp"],
  group: "mcp",
});

def("FILE", env.files, { maxTokens: 100 });

$`Your task is to summarize each file as an emoji.

Return a list of filename: emoji using INI format.`;
