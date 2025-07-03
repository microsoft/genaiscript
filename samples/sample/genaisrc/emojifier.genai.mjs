script({
  group: "mcp",
  parameters: {
    text: "the text to emojify",
  },
});

const text = def("TEXT", env.vars.text);
$`Convert ${text} to emojis.`;
