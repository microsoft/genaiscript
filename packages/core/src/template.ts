// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This module provides functions for parsing and validating prompt scripts
 * within a project. It includes a Checker class for validation of various
 * data types and formats.
 */

import { GENAI_ANY_REGEX, GENAI_MD_REGEX } from "./constants.js";
import { JSON5TryParse } from "./json5.js";
import { humanize } from "./inflection.js";
import { metadataValidate } from "./metadata.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { markdownScriptParse } from "./markdownscript.js";
import { readJSON } from "./fs.js";
import { frontmatterTryParse } from "./frontmatter.js";
import type { PromptArgs, PromptScript, McpServersConfig, McpServerConfig, McpAgentServersConfig, McpAgentServerConfig } from "./types.js";
import { basename, resolve, dirname } from "node:path";
import { readText } from "./fs.js";

/**
 * Extracts a template ID from the given filename by removing specific extensions
 * and directories.
 *
 * @param filename - The filename to extract the template ID from.
 * @returns The extracted template ID.
 */
export function templateIdFromFileName(filename: string) {
  return filename
    .replace(/\.(mjs|ts|js|mts|prompty|md)$/i, "")
    .replace(/\.genai$/i, "")
    .replace(/.*[/\\]/, "");
}

/**
 * Resolves MCP server configuration from either inline configuration or a file path.
 * @param mcpServers - Either an inline configuration object or a file path string
 * @param scriptPath - The path of the script for resolving relative file paths
 * @returns Promise resolving to the MCP servers configuration object
 */
async function resolveMcpServersConfig(
  mcpServers: McpServersConfig | undefined,
  scriptPath: string
): Promise<Record<string, Omit<McpServerConfig, "id" | "options">> | undefined> {
  if (!mcpServers) return undefined;
  
  if (typeof mcpServers === "string") {
    // Handle file path - resolve relative to script directory
    const configPath = resolve(dirname(scriptPath), mcpServers);
    try {
      const config = await readJSON(configPath);
      if (typeof config === "object" && config !== null) {
        // Require Claude format with root mcpServers field
        if (config.mcpServers && typeof config.mcpServers === "object") {
          return config.mcpServers as Record<string, Omit<McpServerConfig, "id" | "options">>;
        } else {
          throw new Error(`Invalid MCP server configuration format in ${configPath}. Configuration must have a root 'mcpServers' field.`);
        }
      } else {
        throw new Error(`Invalid MCP server configuration format in ${configPath}`);
      }
    } catch (error) {
      throw new Error(`Failed to load MCP server configuration from ${configPath}: ${error}`);
    }
  } else {
    // Handle inline configuration
    return mcpServers;
  }
}

/**
 * Resolves MCP agent server configuration from either inline configuration or a file path.
 * @param mcpAgentServers - Either an inline configuration object or a file path string
 * @param scriptPath - The path of the script for resolving relative file paths
 * @returns Promise resolving to the MCP agent servers configuration object
 */
async function resolveMcpAgentServersConfig(
  mcpAgentServers: McpAgentServersConfig | undefined,
  scriptPath: string
): Promise<Record<string, Omit<McpAgentServerConfig, "id" | "options">> | undefined> {
  if (!mcpAgentServers) return undefined;
  
  if (typeof mcpAgentServers === "string") {
    // Handle file path - resolve relative to script directory
    const configPath = resolve(dirname(scriptPath), mcpAgentServers);
    try {
      const config = await readJSON(configPath);
      if (typeof config === "object" && config !== null) {
        // Require Claude format with root mcpAgentServers field
        if (config.mcpAgentServers && typeof config.mcpAgentServers === "object") {
          return config.mcpAgentServers as Record<string, Omit<McpAgentServerConfig, "id" | "options">>;
        } else {
          throw new Error(`Invalid MCP agent server configuration format in ${configPath}. Configuration must have a root 'mcpAgentServers' field.`);
        }
      } else {
        throw new Error(`Invalid MCP agent server configuration format in ${configPath}`);
      }
    } catch (error) {
      throw new Error(`Failed to load MCP agent server configuration from ${configPath}: ${error}`);
    }
  } else {
    // Handle inline configuration
    return mcpAgentServers;
  }
}

/**
 * Parses metadata from the provided JavaScript source code. Determines the script type
 * (e.g., "system" or "script"), extracts metadata, and identifies tools defined in the script.
 *
 * @param jsSource - The JavaScript source code to analyze.
 * @returns An object containing extracted metadata, tool definitions, and system-specific properties.
 */
export function parsePromptScriptMeta(
  jsSource: string,
): PromptArgs & Pick<PromptScript, "defTools"> {
  const m = /\b(?<kind>system|script)\(\s*(?<meta>\{.*?\})\s*\)/s.exec(jsSource);
  const meta: PromptArgs & Pick<PromptScript, "defTools"> = JSON5TryParse(m?.groups?.meta) ?? {};
  if (m?.groups?.kind === "system") {
    meta.unlisted = true;
    meta.isSystem = true;
    meta.group = meta.group || "system";
  }
  meta.defTools = parsePromptScriptTools(jsSource);
  meta.metadata = metadataValidate(meta.metadata);
  return deleteUndefinedValues(meta);
}

function parsePromptScriptTools(jsSource: string) {
  const tools: { id: string; description: string; kind: "tool" | "agent" }[] = [];
  jsSource.replace(
    /def(?<kind>Tool|Agent)\s*\(\s*"(?<id>[^"]+?)"\s*,\s*"(?<description>[^"]+?)"/g,
    (m, kind, id, description) => {
      tools.push({
        id: kind === "Agent" ? "agent_" + id : id,
        description,
        kind: kind.toLocaleLowerCase(),
      });
      return "";
    },
  );
  return tools;
}

/**
 * Extracts frontmatter parameters from markdown content and converts them
 * to the script parameters format.
 *
 * @param content - The markdown content that may contain frontmatter
 * @returns Parameters object or undefined if no frontmatter parameters found
 */
function extractFrontmatterParameters(content: string): Record<string, any> | undefined {
  const fm = frontmatterTryParse(content);
  if (!fm?.value?.parameters) return undefined;
  
  // Return the parameters directly - they should already be in the correct format
  // with type definitions like { type: "string", default: "value" }
  return fm.value.parameters;
}

/**
 * Core function to parse a prompt template and validate its contents.
 *
 * @param filename - The filename of the template.
 * @param content - The content of the template.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
async function parsePromptTemplateCore(filename: string, content: string) {
  // Check if this is a markdown script file
  let jsSource: string;
  let meta: ReturnType<typeof parsePromptScriptMeta>;
  if (GENAI_MD_REGEX.test(filename)) {
    const res = await markdownScriptParse(content, {
      readText,
      baseDir: dirname(filename),
    });
    meta = res.meta;
    jsSource = res.jsSource;
  } else {
    // Use content as-is for JavaScript/TypeScript files
    jsSource = content;
    meta = parsePromptScriptMeta(jsSource);
  }

  // Resolve MCP server configuration if it's a file path
  if (meta.mcpServers) {
    meta.mcpServers = await resolveMcpServersConfig(meta.mcpServers, filename);
  }

  // Resolve MCP agent server configuration if it's a file path
  if (meta.mcpAgentServers) {
    meta.mcpAgentServers = await resolveMcpAgentServersConfig(meta.mcpAgentServers, filename);
  }

  const r = {
    id: templateIdFromFileName(filename),
    title: humanize(basename(filename).replace(GENAI_ANY_REGEX, "")),
    jsSource,
    ...meta,
  } as PromptScript;
  r.filename = resolve(filename);
  return r;
}

/**
 * Parses a prompt script file, validating its structure and content.
 *
 * @param filename - The filename of the script.
 * @param content - The content of the script.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
export async function parsePromptScript(filename: string, content: string) {
  const script = await parsePromptTemplateCore(filename, content);
  
  // Extract frontmatter parameters from markdown files and merge them
  // This handles the case where markdown scripts define parameters in frontmatter
  const frontmatterParameters = extractFrontmatterParameters(content);
  if (frontmatterParameters) {
    script.parameters = {
      ...(script.parameters || {}),
      ...frontmatterParameters
    };
  }
  
  return script;
}
