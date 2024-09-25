// Main entry point for the CLI application

// Import necessary modules and functions
import { installGlobals } from "../../core/src/globals"
import { cli } from "./cli"

// Initialize global settings or variables for the application
// This might include setting up global error handlers or configurations
installGlobals()

// Execute the command-line interface logic
// This function likely handles parsing input arguments and executing commands
cli()
