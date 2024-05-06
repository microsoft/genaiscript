---
layout: two-cols-header
---

# Summarize: Langchain vs GenAIScript
Map-reduce summarization


::left::

## Python w/ langchain

- Summarize already predefined
```python
from langchain.chains.summarize import load_summarize_chain

# Split the source text
text_splitter = CharacterTextSplitter()
texts = text_splitter.split_text(source_text)

# Create Document objects for the texts (max 3 pages)
docs = [Document(page_content=t) for t in texts[:3]]

# Initialize the OpenAI module, load and run the summarize chain
llm = OpenAI(temperature=0, openai_api_key=openai_api_key)
chain = load_summarize_chain(llm, chain_type="map_reduce")
summary = chain.run(docs)

```

::right::

<v-click>

## GenAIScript
- Use JS language constructs

```js
script({ temperature: 0 }) // model settings
// map each file to its summary
for (const file of env.files.slice(0, 3)) {
    // run 3.5 generate summary of a single file
    const { text } = await runPrompt((_) => { 
            _.def("FILE", file)
            _.$`Summarize FILE. Be concise.` 
        }, { model: "gpt-3.5-turbo" })
    // save the summary in the main prompt
    // as a AI variable
    def("FILE", { filename: file.filename, content: text })
}
// reduce all summaries to a single summary
$`Summarize all the FILE.`
```

</v-click>
