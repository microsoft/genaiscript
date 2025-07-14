import { script, $, def } from "genaiscript";

script({
  title: "poem with fake imports",
  files: "src/rag/markdown.md",
});

def("FILE", env.files);
$`Write a short poem`;
