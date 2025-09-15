import { describe, test } from "node:test"
import assert from "node:assert"
import { setupMcpCommands } from "./mcpcommands"
import { Command } from "commander"

describe("MCP Commands", () => {
    test("should setup MCP commands without errors", () => {
        const program = new Command()
        
        // This should not throw
        setupMcpCommands(program)
        
        // Verify that the mcp command was added directly to the program
        const mcpCommand = program.commands.find(cmd => cmd.name() === "mcp")
        assert(mcpCommand, "mcp command should be created")
        
        // Verify all expected subcommands exist
        const expectedCommands = ["add", "list", "get", "remove", "inspect"]
        for (const cmdName of expectedCommands) {
            const cmd = mcpCommand.commands.find(c => c.name() === cmdName)
            assert(cmd, `${cmdName} command should exist`)
        }
    })

    test("should have correct command descriptions", () => {
        const program = new Command()
        setupMcpCommands(program)
        
        const mcpCommand = program.commands.find(cmd => cmd.name() === "mcp")
        assert.strictEqual(mcpCommand?.description(), "Model Context Protocol server management")
    })

    test("should handle argument parsing correctly", () => {
        const program = new Command()
        setupMcpCommands(program)
        
        // Verify command exists and has correct argument structure
        const mcpCommand = program.commands.find(cmd => cmd.name() === "mcp")
        const addCommand = mcpCommand?.commands.find(cmd => cmd.name() === "add")
        
        assert(addCommand, "add command should exist")
        assert.strictEqual(addCommand.description(), "Add a new MCP server configuration")
        
        // Verify that add command has the expected options
        const options = addCommand.options
        const transportOption = options.find(opt => opt.long === '--transport')
        const workflowOption = options.find(opt => opt.long === '--workflow')
        
        assert(transportOption, "transport option should exist")
        assert(workflowOption, "workflow option should exist")
    })
})