import { Code } from '@astrojs/starlight/components';
import importedCode from "../../../../../packages/sample/genaisrc/blog-generate-knowledge.genai?raw"

[Generated Knowledge](https://learnprompting.org/docs/intermediate/generated_knowledge)
is a prompting technique where one first asks the LLM a question to generate facts, 
then uses the generated answer to answer a question correctly.

- _knownledge generation_, the LLM is asked to generate a set of facts about the question.
- _knownledge integration_, the LLM is asked a question augmented by the knowledge generated

This technique can be acheived by using [runPrompt](/genaiscript/reference/scripts/inline-prompts)
to execute an LLM request and use it in the final prompt.

## Example

This example demanstrates this technique to generate a blog post.

<Code code={importedCode} wrap={true} lang="js" />
