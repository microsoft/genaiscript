// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This file contains functions to manage and compile project scripts,
// including listing, creating, fixing, and compiling scripts.

import { buildProject } from "@genaiscript/core";
import { shellInput } from "@genaiscript/runtime";
import type { ScriptFilterOptions } from "@genaiscript/core";
import {
  CONSOLE_COLOR_DEBUG,
  copyPrompt,
  createScript as coreCreateScript,
  dedent,
  deleteEmptyValues,
  filterScripts,
  fixGitHubCopilotInstructions,
  fixPromptDefinitions,
  JSONSchemaToFunctionParameters,
  wrapColor,
} from "@genaiscript/core";
import { dirname } from "node:path";
import { compileScript } from "./typescript.js";

/**
 * Lists all the scripts in the project.
 * Displays id, title, group, filename, and system status.
 * Generates this list by first building the project.
 * Filters scripts based on provided ids and options.
 * Outputs the list in plain text or JSON format based on the json option.
 * @param ids - An array of script IDs to filter.
 * @param options - Additional filtering options, including whether to output in JSON format.
 *                 If not provided, defaults to plain text output.
 */
export async function listScripts(
  ids: string[],
  options?: ScriptFilterOptions & { json?: boolean },
) {
  const { json } = options || {};
  const prj = await buildProject(); // Build the project to get script templates
  const scripts = filterScripts(prj.scripts, { ids, ...(options || {}) }); // Filter scripts based on options
  if (!json) console.log(scripts.map(({ id, filename }) => `${id} - ${filename}`).join("\n"));
  else
    console.log(
      JSON.stringify(
        scripts.map(({ id, title, group, filename, inputSchema, isSystem }) =>
          deleteEmptyValues({
            id,
            title,
            group,
            filename,
            inputSchema,
            isSystem,
          }),
        ),
        null,
        2,
      ),
    );
}

/**
 * Retrieves detailed information about a specific script by its ID.
 * Outputs metadata such as its title, file location, and accepted input types.
 * Also displays the script's function signature, including its input schema and file handling capabilities.
 *
 * @param scriptId - The unique identifier of the script to locate.
 *
 * The function checks if the script exists in the project. If found, it prints
 * metadata and the script's function signature. If not found, it logs an error message.
 */
export async function scriptInfo(scriptId: string) {
  const prj = await buildProject();
  const script = prj.scripts.find((t) => t.id === scriptId);
  if (!script) {
    console.log(`script ${scriptId} not found`);
    return;
  }

  const { inputSchema, id, filename, title, accept } = script;
  const parameters = inputSchema?.properties?.script;
  const sigArguments = JSONSchemaToFunctionParameters(parameters).split(/,\s*/g);
  if (accept !== "none") sigArguments.unshift(`files: ${accept || "*"}`);
  const sig = sigArguments.join(",\n  ");
  const secondary = (s: string) => wrapColor(CONSOLE_COLOR_DEBUG, s);

  console.log(
    secondary(
      dedent`/** 
        * ${title || ""} 
        * @see ${secondary(filename)}
        */`,
    ),
  );
  console.log(`${id}${sig ? secondary(`(${sig})`) : ""}`);
  return;
}

/**
 * Creates a new script.
 * Prompts the user for the script name if not provided.
 * Calls the core function to create a script and copies prompt definitions.
 * Compiles the newly created script immediately after creation.
 * Logs the location of the created script.
 * @param name - The name of the script to be created. If not provided, the user will be prompted to enter it.
 * @param options - Options for script creation, including whether to use TypeScript.
 */
export async function createScript(name: string, options: { typescript: boolean }) {
  const { typescript } = options;
  if (!name) {
    name = await shellInput("Enter the name of the script"); // Prompt user for script name if not provided
    if (!name) return;
  }

  const t = coreCreateScript(name); // Call core function to create a script
  const pr = await copyPrompt(t, {
    fork: true,
    name,
    javascript: !typescript,
  }); // Copy prompt definitions
  console.log(`created script at ${pr}`); // Notify the location of the created script
  await compileScript([dirname(pr)]); // Compile all scripts immediately after creation
}

/**
 * Fixes prompt definitions and custom prompts in the project.
 * Used to correct any issues in the prompt definitions.
 * Accesses project information by building the project first.
 *
 * @param options - Optional settings to fix specific types of prompts, such as GitHub Copilot prompts or custom prompts.
 */
export async function fixScripts(options?: {
  githubCopilotInstructions?: boolean;
  docs?: boolean;
  force?: boolean;
}) {
  const project = await buildProject(); // Build the project to access information
  await fixPromptDefinitions(project, options); // Fix any issues in prompt definitions
  await fixGitHubCopilotInstructions(options);
}
