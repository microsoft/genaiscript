script({
  model: "echo",
});

def("TEXT", env.vars["editor.selectedText"]);
$`Summarize <TEXT> in a single sentence.`;
