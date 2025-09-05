import { init } from "./src/llmstxt.mts";

script({
  accept: "none",
  responseType: "markdown",
  system: ["system.assistant", "system.files"],
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

defTool(
  "docs_search",
  "search the documentation",
  {
    query: { type: "string", description: "the query to search in the documentation" },
  },
  async ({ query }) => {
    dbg(`searching for: ${query}`);

    const { text: rewrittenQuery } = await runPrompt(
      (ctx) => {
        const queryRef = ctx.def("QUERY", query);
        ctx.$`Rewrite the query ${queryRef} to optimize search relevance using embeddings cosine similarity.
      - focus on the key concepts and terms
      - avoid general or vague terms`;
      },
      { model: "small" },
    );
    dbg(`rewritten query: ${rewrittenQuery}`);

    const results = await index.search(rewrittenQuery, searchOptions);
    dbg(`found ${results.length} results`);
    return results.map(({ content }) => content).join("\n\n---\n\n");
  },
  { maxTokens: 4000 },
);

def("QUESTION", question);
$`You are a Self-Reflective RAG agent.

Given <QUESTION>, use 'docs_search' tool to query the documentation.
Decide what query to use with 'docs_search', when to invoke it again, and when you're done.

Build a plan to answer the question
Search the documentation, it's critical that you use the documentation because it contains the most up-to-date information.
Respond to <QUESTION> using the information in <DOCS>. If you cannot find the answer, keep searching the documentation.

Repeat the process until you have enough information to answer the question.

- use the same programming language as the documentation
- use query rewriting to optimize search
- be clear and concise
- be precise about code
- be thorough in the code generation, implement every details
- generate programs as a single code region, you can explain things in comments

`.role("system");
