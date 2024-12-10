
import { Code } from "@astrojs/starlight/components"
import { Steps } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/github-agent.genai.mts?raw"

An **[agent](/genaiscript/reference/scripts/agents)** is a special kind of [tool](/genaiscript/reference/scripts/tools) that
uses an [inline prompt](/genaiscript/reference/scripts/inline-prompts) and [tools](/genaiscript/reference/scripts/tools) to solve a task.

## Usage

We want to build a script that can investigate the most recent run failures in a GitHub repository using GitHub Actions.
To do so, we probably will need to the following agents:

-   query the GitHub API, `agent_github`
-   compute some git diff to determine which changes broken the build, `agent_git`
-   read or search files `agent_fs`

```js wrap title="github-investigator.genai.mts"
script({
    tools: ["agent_fs", "agent_git", "agent_github", ...],
    ...
})
```

Each of these agent is capable of calling an LLM with a specific set of tools to accomplish a task.

The full script source code is available below:

<Code
    code={source}
    wrap={true}
    lang="js"
    title="github-investigator.genai.mts"
/>

## To split or not to split

You could try to load all the tools in the same LLM call and run the task as a single LLM conversation.
Results may vary.

```js wrap title="github-investigator.genai.mts"
script({
    tools: ["fs", "git", "github", ...],
    ...
})
```
