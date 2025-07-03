script({
  flexTokens: 64000,
});

const { files, vars } = env;
const { question } = vars;
if (!question) cancel("Did you mean to ask something?");

// rewrite question for rag
const kw = await runPrompt(
  (_) => {
    _.def("QUESTION", question);
    _.$`You are an external RAG tool. You were given a user query in <QUESTION> and your task is to rewrite it for a vector search. 
        Only return keywords that are relevant to the query. Separate keywords with a space, no punctuation.
        Do not include any other text.`;
  },
  {
    model: "small",
    responseType: "text",
    label: "rewrite question",
    cache: true,
  },
);
if (kw.error) cancel(kw.error.message);

// user input
def("FILES", files, { ignoreEmpty: true });
console.log(`search query: ${kw.text}`);

// rag the docs
const docs = await host.fetchText("https://microsoft.github.io/genaiscript/llms-full.txt");
if (!docs.ok) cancel("Could not fetch docs");
docs.file.content = docs.file.content.replace(/!\[\]\(\<data:image\/svg\+xml.*?>\)/g, "");

// keyword search
const grepped = (
  await workspace.grep(
    "(" + kw.text.split(/\s/g).join("|") + ")",
    "packages/sample/genaisrc/*.genai.*",
  )
).files;
def("DOCS", grepped, { ignoreEmpty: true, flex: 1 });

// vector search
const docsIndex = await retrieval.index("docs");
await docsIndex.insertOrUpdate(docs.file);
await docsIndex.insertOrUpdate({ filename: "genaisrc/genaiscript.d.ts" });
const vectorDocs = await docsIndex.search(kw.text);
def("DOCS", vectorDocs, { ignoreEmpty: true, flex: 3 });

// fuzzy search
const chunks = await MD.chunk(docs.file, { maxTokens: 512 });
const fuzzDocs = await retrieval.fuzzSearch(kw.text, chunks, {
  topK: 5,
});
def("DOCS", fuzzDocs, { ignoreEmpty: true, flex: 1 });

def("PSEUDO_CODE", question);
$`You are an expert at the TypeScript, Node.JS and the GenAIScript script language documented in <DOCS>.`;
$`Your task is to implement the pseudo code in <PSEUDO_CODE> into a GenAIScript script.
- Generate TypeScript ESM using async/await.
- The types in 'genaiscript.d.ts' are already imported.
- Use the information in <DOCS> to answer the question about GenAIScript.
- Avoid try/catch blocks, keep the code simple, and avoid unnecessary complexity.
- Try to not use any other libraries or modules.
`;
