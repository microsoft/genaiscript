import { init } from "./src/llmstxt.mts";

script({
  accept: "none",
  parameters: {
    question: {
      type: "string",
      description: "the question to ask to the documentations",
      required: true,
    },
  },
});

const { vars, output, dbg } = env;
const { question } = vars;
const { index, searchOptions } = await init();
dbg(`query: ${question}`);
dbg(`search options: %O`, searchOptions);
const docs = await index.search(question, searchOptions);
dbg(`docs found: ${docs.length}`);
for (const doc of docs) {
  dbg(`chunk ${doc.content.length}c, ${doc.score}`);
}

docs.forEach((doc) => output.fence(doc.content.slice(0, 160) + "..."));
