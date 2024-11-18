import packageJson from "../package.json"

// This file exports specific versions of dependencies and engines from package.json.

/**
 * The minimum required Node.js version for this package.
 * Retrieved from the "engines" field in package.json.
 */
export const NODE_MIN_VERSION = packageJson.engines.node

/**
 * The version of the 'promptfoo' peer dependency.
 * Retrieved from the "peerDependencies" field in package.json.
 */
export const PROMPTFOO_VERSION = packageJson.peerDependencies.promptfoo

/**
 * The version of the 'typescript' dependency.
 * Retrieved from the "dependencies" field in package.json.
 */
export const TYPESCRIPT_VERSION = packageJson.dependencies.typescript

/**
 * The version of the 'dockerode' dependency.
 * Retrieved from the "dependencies" field in package.json.
 */
export const DOCKERODE_VERSION = packageJson.dependencies.dockerode

/**
 * The version of the 'playwright' dependency.
 * Retrieved from the "dependencies" field in package.json.
 */
export const PLAYWRIGHT_VERSION = packageJson.optionalDependencies.playwright
