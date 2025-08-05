"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHost = void 0;
// This module defines a TestHost class that implements the RuntimeHost interface.
// It provides various functionalities related to language models, file operations, and other utilities.
// Tags: RuntimeHost, TestHost, LanguageModel, FileSystem, Node.js
// Import necessary modules and functions from various files
const promises_1 = require("fs/promises");
const fs_js_1 = require("./fs.js");
const host_js_1 = require("./host.js");
const node_path_1 = require("node:path");
const error_js_1 = require("./error.js");
const llms_js_1 = require("./llms.js");
const path_js_1 = require("./path.js");
const mcpresource_js_1 = require("./mcpresource.js");
const node_child_process_1 = require("node:child_process");
const shell_js_1 = require("./shell.js");
const debug_js_1 = require("./debug.js");
const globals_js_1 = require("./globals.js");
const global_js_1 = require("./global.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("host:test");
// Class representing a test host for runtime, implementing the RuntimeHost interface
class TestHost {
    project;
    // State object to store user-specific data
    userState = {};
    // Server management service
    server;
    // Instance of the path utility
    path = (0, path_js_1.createNodePath)();
    // File system for workspace
    workspace;
    // Default options for language models
    modelAliases = (0, llms_js_1.defaultModelConfigurations)();
    mcp;
    resources;
    // Static method to set this class as the runtime host
    static install() {
        (0, globals_js_1.installGlobals)();
        (0, host_js_1.setRuntimeHost)(new TestHost());
    }
    constructor() {
        this.resources = new mcpresource_js_1.ResourceManager();
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
        throw new error_js_1.NotSupportedError("contentSafety");
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
        return (0, node_path_1.resolve)(".");
    }
    // Placeholder for path resolution method
    resolvePath(...segments) {
        return this.path.resolve(...segments);
    }
    // Placeholder for reading a secret value
    readSecret(name) {
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
        const fn = global_js_1.originalConsole[level] || global_js_1.originalConsole.debug;
        fn(msg);
    }
    // Method to read a file and return its content as a Uint8Array
    async readFile(name) {
        return new Uint8Array(await (0, promises_1.readFile)((0, node_path_1.resolve)(name)));
    }
    async statFile(name) {
        return undefined;
    }
    // Method to write content to a file
    async writeFile(name, content) {
        await (0, promises_1.writeFile)((0, node_path_1.resolve)(name), content);
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
        await (0, fs_js_1.ensureDir)(name);
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
            const cmd = command + " " + (0, shell_js_1.shellQuote)(args);
            dbg(`%s> %s`, process.cwd(), cmd);
            const stdout = await (0, node_child_process_1.execSync)(cmd, { encoding: "utf-8" });
            return {
                stdout,
                exitCode: 0,
                failed: false,
            };
        }
        catch (error) {
            return {
                stderr: (0, error_js_1.errorMessage)(error),
                failed: true,
                exitCode: -1,
            };
        }
    }
    // Placeholder for creating a container host
    container(options) {
        throw new Error("Method not implemented.");
    }
    // Async method to remove containers
    async removeContainers() { }
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
exports.TestHost = TestHost;
//# sourceMappingURL=testhost.js.map