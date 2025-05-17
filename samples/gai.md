import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/samples/gai.genai.mts?raw"
import gasource from "../../../../../.github/workflows/genai-investigator.yml?raw"

The following sample shows a script that analyzes a GitHub Action Workflow Job log and attempts to determine the root cause of the issue.

## Strategy

The script is a hybrid between traditional software and LLM/Agent based software. We start by collecting relevant information for the LLM, to fill the context with relevant information
then we let the agent reason and ask for more information as needed through tools.

The first part of the script is a traditional software that collects the information
and prepares the context for the LLM. It uses the following simple strategy:

- find information about the failed workflow run, including commit, and job logs
- find the last successful workflow run if any, and gather the commit, and job lobs
- build a LLM context with all the information, including commit diffs, and job lobs diffs.

The information gathered is this section is **not** hallucinated by design and added to the final output using the `env.output` object.

The second part is an agent that uses the LLM to reason about the information and ask for more information as needed.

## Add the script

- Open your GitHub repository and start a new pull request.
- Add the following script to your repository as `genaisrc/prr.genai.mts`.

<Code code={source} wrap={true} lang="ts" title="gai.genai.mts" />

## Automate with GitHub Actions

Using [GitHub Actions](https://docs.github.com/en/actions) and [GitHub Models](https://docs.github.com/en/github-models),
you can automate the execution of the script and creation of the comments.

You can decide to turn on/off the agentic part of the script my commenting out the `agent_*` line.
A script without agent has a predictable token consumption behavior (it's 1 LLM call);
an agentic script will go into a loop and will consume more tokens, but it will be able to ask for more information if needed.

<Code code={gasource} wrap={true} lang="yaml" title="gai.yml" />

## Are we done yet?

No! This script is far from perfect and in fact, it probably needs better heuristics to build the context **that is specific to your repository**.
This is a good starting point, but you will need to tweak the heuristics to make it work for your repository.