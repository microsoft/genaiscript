import { ModelConfiguration } from "./host"

/**
 * Schema for a global configuration file
 */
export interface HostConfiguration {
    /**
     * Path to the .env file
     */
    envFile?: string | string[]

    /**
     * List of glob paths to scan for genai scripts
     */
    include?: string[]

    /**
     * Configures a list of known aliases. Overriden by environment variables and CLI arguments
     */
    modelAliases?: Record<string, string | ModelConfiguration>

    /**
     * Model identifier to encoding mapping
     */
    modelEncodings?: Record<string, string>

    /**
     * A map of secret name and their respective regex pattern
     */
    secretPatterns?: Record<string, string>
}
