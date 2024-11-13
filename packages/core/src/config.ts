import { PromptScriptRunOptions } from "./server/messages"

/**
 * Schema for a global configuration file
 */
export interface GenAIScriptConfiguration {
    /**
     * Path to the .env file
     */
    env?: string
    
    /**
     * Common run options
     */
    run?: PromptScriptRunOptions
}
