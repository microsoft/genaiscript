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
}
