import packageJson from "../package.json"

export const NODE_MIN_VERSION = packageJson.engines.node
export const LLAMAINDEX_VERSION = packageJson.optionalDependencies.llamaindex
export const PROMPTFOO_VERSION = packageJson.dependencies.promptfoo
export const TYPESCRIPT_VERSION = packageJson.dependencies.typescript
export const DOCKERODE_VERSION = packageJson.dependencies.dockerode
