
**Getting the most out of using GenAIScript requires rethinking what you expect software can do.**
The most important element of using GenAIScript is the innovation that the user brings to
leveraging the power of the LLM for their needs. Here are some general guidelines
for using it most effectively.

## Be ambitious about what you want your script to do

Remember, LLMs in GenAIScript can do things that no other software has been able to do. Think outside the box in the ways that you
use it. LLMs can critically review a document, write poetry, and analyze images, just
as a starting point. They have built-in expertise on many different human endeavors, math,
history, etc. and their knowledge can be easily extended by adding more context to the
script input (see next point).

## Given the model the context it needs

The more context you give the LLM
in completing the task, the more effective it can be in solving it. The prompt
in the script is one part of the input, but using `def`, you can provide the LLM with
lots of additional information. For example, if you want to use GenAIScript to plan
a weekend vacation, use the [Web Search](/genaiscript/reference/scripts/web-search) capability
to give the model information about things to do or what the weather will be at your
destination. Input from documents is especially valuable to help the model perform
well and as a result we define simple ways to extract text from [pdf](/genaiscript/reference/scripts/pdf)
and [docx](/genaiscript/reference/scripts/docx) files. You can parameterize the
input context further using [`env.files`](/genaiscript/reference/scripts/context).

## Focus a GenAIScript on having the LLM do 1 thing well

Say I wanted to use a GenAIScript to write a novel. Instead of asking the model to
write a whole novel or white paper as one prompt, I would divide the task
into different parts: generate the characters, establish a setting, develop a plot, etc.
and create GenAIScripts for each. By breaking down the problem, you can debug
the script to accomplish the specific task well and then move on.
Once you have one effective script, you can feed its output (like the list
of characters in a novel) into other scripts as part of the context.

## Use the output of 1 GenAIScript as input to another

Combining the two points above, you can create a collection of inter-related
scripts that accomplish a more ambitious goal. Depending on your level of
expertise, the combination can be accomplished by using the command line
interface to the scripts [CLI](/genaiscript/reference/cli) and using
traditional software to connect them.

## Don't assume that the LLM will do programming tasks

If you want to
apply a GenAIScript to all the files in a directory, use the command line
invocation of the script [CLI](/genaiscript/reference/cli/)
and a non-AI script to iterate over all the files. You can use an GenAIScript to
write code, but the code the LLM generates will not automatically run after you
generate it. You need to run and debug the generated code yourself.

## Use the right LLM or other foundation model for the task

Consult the documentation for the specific LLM you are using to understand how to write prompts that effectively communicate the task you want the AI to perform. Parameters between LLMs vary, for example, the size of the input context allowed, so make sure
that the content you want to communicate to the LLM fits in its context window size.
