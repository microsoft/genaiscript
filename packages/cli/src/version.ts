import packageJson from "../package.json"

export const NODE_MIN_VERSION = packageJson.engines.node
export const PROMPTFOO_VERSION = packageJson.devDependencies.promptfoo
export const TYPESCRIPT_VERSION = packageJson.dependencies.typescript
export const DOCKERODE_VERSION = packageJson.dependencies.dockerode
