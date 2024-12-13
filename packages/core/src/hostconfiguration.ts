import { ModelConfiguration } from "./host"

/**
 * Schema for a global configuration file
 */
export interface HostConfiguration {
    /**
     * Path to the .env file
     */
    envFile?: string

    /**
     * List of glob paths to scan for genai scripts
     */
    include?: string[]

    /**
     * Configures a list of known aliases. Can be overriden by the CLI or environment variables
     */
    modelAliases?: Record<string, string | ModelConfiguration>
}
