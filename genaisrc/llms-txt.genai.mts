script({
    title: "llms.txt generator",
    tools: "fs",
})
const spec = def("LLMS_TXT_SPEC", { filename: "https://llmstxt.org/index.md" })

$`You are an expert at SEO, LLM optimization and documentation. 
Take a deep breath and reason step by step.

# Task 1: Learn about llms.txt

The llms.txt is a LLM friendly file that describes the content of a web site.
The full specification can be found in ${spec}.

# Task 2: Analyze the documentation

Explore and analyze the GenAIScript documentation site at https://microsoft.github.io/genaiscript.

- The documentation site is built from markdown at ./docs/src/content/docs/**.{md,mdx}.
- Use the metadata from the frontmatter of the markdown files.
- Ignore slides

# Task 3: Generate llms.txt

Using the documentation structured, generate a /.well-known/llms.txt file for the GenAIScript documentation site at https://microsoft.github.io/genaiscript.

- use concise, clear language. 
- When linking to resources, include brief, informative descriptions. Avoid ambiguous terms or unexplained jargon.
- All URLs in the llms.txt file should be relative to the root of the documentation site: /genaiscript/<relative path>
- do NOT use file extension in the URLS. The '.md' or '.mdx' extensions are removed from the URL.
- The documentation is compiled using @astrojs/starlight. 
- do NOT invent new URLs, only use existing URLs from the documentation files.

`
defFileOutput("docs/public/.well-known/llms.txt", "Generated llms.txt file")
