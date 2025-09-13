import { loadClaudeMcpConfig } from "./mcp-config.js"
import { writeJSON, readJSON } from "./fs.js"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { mkdtemp, rm } from "node:fs/promises"

describe("MCP Configuration Loading", () => {
    let tempDir: string

    beforeEach(async () => {
        tempDir = await mkdtemp(resolve(tmpdir(), "genaiscript-mcp-test-"))
    })

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true })
    })

    test("should load basic MCP configuration", async () => {
        const configPath = resolve(tempDir, "mcp.json")
        const config = {
            servers: {
                filesystem: {
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-filesystem"]
                },
                memory: {
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-memory"]
                }
            }
        }

        await writeJSON(configPath, config)
        const result = await loadClaudeMcpConfig(configPath)

        expect(result).toEqual({
            filesystem: {
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-filesystem"],
                env: undefined,
                cwd: undefined
            },
            memory: {
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-memory"],
                env: undefined,
                cwd: undefined
            }
        })
    })

    test("should interpolate workspaceFolder variable", async () => {
        const configPath = resolve(tempDir, "mcp.json")
        const workspaceFolder = "/test/workspace"
        const config = {
            servers: {
                filesystem: {
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
                }
            }
        }

        await writeJSON(configPath, config)
        const result = await loadClaudeMcpConfig(configPath, workspaceFolder)

        expect(result.filesystem.args).toEqual([
            "-y", 
            "@modelcontextprotocol/server-filesystem", 
            workspaceFolder
        ])
    })

    test("should interpolate environment variables", async () => {
        const configPath = resolve(tempDir, "mcp.json")
        const config = {
            servers: {
                test: {
                    command: "test",
                    env: {
                        "DEBUG": "${env:TEST_DEBUG}",
                        "PATH": "${env:PATH}"
                    }
                }
            }
        }

        // Set test environment variable
        process.env.TEST_DEBUG = "true"

        await writeJSON(configPath, config)
        const result = await loadClaudeMcpConfig(configPath)

        expect(result.test.env.DEBUG).toBe("true")
        expect(result.test.env.PATH).toBe(process.env.PATH)
    })

    test("should handle missing configuration file", async () => {
        const nonExistentPath = resolve(tempDir, "missing.json")
        
        await expect(loadClaudeMcpConfig(nonExistentPath)).rejects.toThrow(
            /MCP configuration file not found/
        )
    })

    test("should handle invalid JSON", async () => {
        const configPath = resolve(tempDir, "invalid.json")
        await writeJSON(configPath, "invalid json content")
        
        await expect(loadClaudeMcpConfig(configPath)).rejects.toThrow(
            /Failed to parse MCP configuration file/
        )
    })

    test("should handle missing servers object", async () => {
        const configPath = resolve(tempDir, "no-servers.json")
        const config = { other: "data" }
        
        await writeJSON(configPath, config)
        
        await expect(loadClaudeMcpConfig(configPath)).rejects.toThrow(
            /Invalid MCP configuration: missing or invalid 'servers' object/
        )
    })

    test("should use config file directory as default workspace folder", async () => {
        const configPath = resolve(tempDir, "mcp.json")
        const config = {
            servers: {
                filesystem: {
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
                }
            }
        }

        await writeJSON(configPath, config)
        const result = await loadClaudeMcpConfig(configPath)

        expect(result.filesystem.args[2]).toBe(tempDir)
    })
})