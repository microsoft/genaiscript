---
layout: two-cols-header
---

# Summarize: Langchain vs GenAIScript


::left::

## Python 
```python
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

## GenAIScript Version 
- Reads **multiple** file types
- Write the result to file "summarize.md"

```js
script({
    title: "summarize any file"
})

def("FILE", env.files)

$`Write a summary of FILE in summary.md`
```

</v-click>
