import packageJson from "../package.json"

export const LLAMAINDEX_VERSION = packageJson.optionalDependencies.llamaindex
export const LLM_CODE_HIGHLIGHTER_VERSION =
    packageJson.optionalDependencies["llm-code-highlighter"]
