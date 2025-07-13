/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// This module defines a TestHost class that implements the RuntimeHost interface.
// It provides various functionalities related to language models, file operations, and other utilities.
// Tags: RuntimeHost, TestHost, LanguageModel, FileSystem, Node.js
// Import necessary modules and functions from various files
import { readFile, writeFile } from "fs/promises";
import { ensureDir } from "./fs.js";
import { setRuntimeHost, } from "./host.js";
import { resolve } from "node:path";
import { errorMessage, NotSupportedError } from "./error.js";
import { defaultModelConfigurations } from "./llms.js";
import { createNodePath } from "./path.js";
import { ResourceManager } from "./mcpresource.js";
import { execSync } from "node:child_process";
import { shellQuote } from "./shell.js";
import { genaiscriptDebug } from "./debug.js";
import { installGlobals } from "./globals.js";
import { originalConsole } from "./global.js";
const dbg = genaiscriptDebug("host:test");
// Class representing a test host for runtime, implementing the RuntimeHost interface
export class TestHost {
    project;
    // State object to store user-specific data
    userState = {};
    // Server management service
    server;
    // Instance of the path utility
    path = createNodePath();
    // File system for workspace
    workspace;
    // Default options for language models
    modelAliases = defaultModelConfigurations();
    mcp;
    resources;
    // Static method to set this class as the runtime host
    static install() {
        installGlobals();
        setRuntimeHost(new TestHost());
    }
    constructor() {
        this.resources = new ResourceManager();
    }
    async pullModel(cfg, options) {
        return { ok: true };
    }
    clearModelAlias(source) {
        this.modelAliases[source] = {};
    }
    setModelAlias(source, id, value) {
        if (typeof value === "string")
            value = { source, model: value };
        this.modelAliases[id] = value;
    }
    async readConfig() {
        return {};
    }
    get config() {
        return {};
    }
    contentSafety(id, options) {
        throw new NotSupportedError("contentSafety");
    }
    // Method to create a UTF-8 decoder
    createUTF8Decoder() {
        return new TextDecoder("utf-8");
    }
    // Method to create a UTF-8 encoder
    createUTF8Encoder() {
        return new TextEncoder();
    }
    // Method to get the current project folder path
    projectFolder() {
        return resolve(".");
    }
    // Placeholder for path resolution method
    resolvePath(...segments) {
        return this.path.resolve(...segments);
    }
    // Placeholder for reading a secret value
    readSecret(name) {
        throw new Error("Method not implemented.");
    }
    // Placeholder for browsing a URL
    browse(url, options) {
        throw new Error("Method not implemented.");
    }
    // Placeholder for getting language model configuration
    getLanguageModelConfiguration(modelId) {
        throw new Error("Method not implemented.");
    }
    // Optional client language model
    clientLanguageModel;
    // Placeholder for logging functionality
    log(level, msg) {
        const fn = originalConsole[level] || originalConsole.debug;
        fn(msg);
    }
    // Method to read a file and return its content as a Uint8Array
    async readFile(name) {
        return new Uint8Array(await readFile(resolve(name)));
    }
    async statFile(name) {
        return undefined;
    }
    // Method to write content to a file
    async writeFile(name, content) {
        await writeFile(resolve(name), content);
    }
    // Placeholder for file deletion functionality
    deleteFile(name) {
        throw new Error("Method not implemented.");
    }
    // Placeholder for finding files with a glob pattern
    async findFiles(pattern, options) {
        return [pattern];
    }
    // Placeholder for creating a directory
    async createDirectory(name) {
        await ensureDir(name);
    }
    // Placeholder for deleting a directory
    deleteDirectory(name) {
        throw new Error("Method not implemented.");
    }
    // Placeholder for executing a shell command in a container
    async exec(containerId, command, args, options) {
        if (containerId)
            throw new Error("Container not started");
        try {
            const cmd = command + " " + shellQuote(args);
            dbg(`%s> %s`, process.cwd(), cmd);
            const stdout = await execSync(cmd, { encoding: "utf-8" });
            return {
                stdout,
                exitCode: 0,
                failed: false,
            };
        }
        catch (error) {
            return {
                stderr: errorMessage(error),
                failed: true,
                exitCode: -1,
            };
        }
    }
    // Placeholder for creating a container host
    container(options) {
        throw new Error("Method not implemented.");
    }
    /**
     * Instantiates a python evaluation environment
     */
    python(options) {
        throw new Error("python");
    }
    // Async method to remove containers
    async removeContainers() { }
    // Async method to remove browsers
    async removeBrowsers() { }
    // Placeholder for selecting an option from a list
    select(message, options) {
        throw new Error("Method not implemented.");
    }
    // Placeholder for input functionality
    input(message) {
        throw new Error("Method not implemented.");
    }
    // Placeholder for confirmation functionality
    confirm(message) {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=testhost.js.map