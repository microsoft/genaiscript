script({
  model: "large",
  responseType: "json_schema",
  responseSchema: {
    type: "object",
    properties: {
      sentences: {
        type: "array",
        items: {
          type: "string",
        },
      },
      wordCount: {
        type: "integer",
      },
      sentenceCount: {
        type: "number",
      },
    },
    required: ["sentences", "wordCount", "sentenceCount"],
  },
});
$`Generate 10 random sentences of 5 words. Use quotes (") to start a word, single quote ' to finish a word!
Place problematic characters for JSON in the sentences.

"hello' "sir' "!'
`;
