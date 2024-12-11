
## GenAIScript allows chatbot users to create reusable scripts

If you have used an LLM-based chatbot, like ChatGPT, you are familiar with the kinds
of things that LLMs can do that ordinary software (that doesn't use LLMs) cannot. For example,
LLMs can review a document, write poetry, and analyze images, just
as a starting point (with the caveat that sometimes they make mistakes).
GenAIScript allows you to write a prompt that is embedded in a JavaScript framework
so that the prompt can be parameterized, tested, debugged, reused, and run from a command line.

## Given the model the context it needs from documents

GenAIScript allows users to add documents to their prompts. This
allows the LLM to have more background information related to the
task it is being asked to do.
In a GenAIScript, the JavaScript [`def`](/genaiscript/reference/scripts/context) command gives the
LLM the contents of a document and defines a name that
can be used in the prompt to refer to that document.
Standard document formats, like [pdf](/genaiscript/reference/scripts/pdf)
and [docx](/genaiscript/reference/scripts/docx) are supported so you just have
to name the files and our libraries will extract the text automatically.
You can parameterize the
input context further using [`env.files`](/genaiscript/reference/scripts/context).

## Focus a GenAIScript on having the LLM do 1 thing well

Say I wanted to use a GenAIScript to write a white paper. Instead of asking the model to
write the whole paper as one prompt, I would divide the task
into different parts: write the introduction, write the recommendations,
write the conclusion, etc. By breaking down the problem into subproblems, you can debug
the script to accomplish the specific task well and then move on.

## Use the output of 1 GenAIScript as input to another

Combining the two points above, you can create a collection of inter-related
scripts that accomplish a more ambitious goal. Depending on your level of
expertise, the combination can be accomplished by using the command line
interface to the scripts [CLI](/genaiscript/reference/cli) and using
traditional software to connect them.

## Use the right LLM or other foundation model for the task

There are currently many different choices of AI models.  We outline
how to connect many of these with GenAIScript in [configuration](/genaiscript/getting-started/configuration).
They vary in capabilities and cost, with some being available as open source
and usable (with the right GPU) for free.
Consult the documentation for the specific LLM or other model
you are using to understand how to write prompts that effectively 
communicate the task you want the AI to perform. 
Parameters between LLMs vary, for example, the size of the input context allowed, so make sure
that the content you want to communicate to the LLM fits in its context window size.
