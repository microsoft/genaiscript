import type { GenerationOptions } from "./generation.js";
import type { Project } from "./server/messages.js";
/**
 * Resolves and returns a list of unique systems based on the provided script and project.
 * Analyzes script options, JavaScript source code, tools, resolved tools, and MCP servers to determine applicable systems.
 *
 * @param prj - The project object containing templates, tools, scripts, and other project-related data.
 * @param script - An object containing prompt system options, model options, content safety options, and optionally JavaScript source code.
 * @param resolvedTools - An optional array of tools resolved externally for additional system inclusion.
 * @returns An array of unique system prompt instances applicable based on the analysis, including both system IDs and instances.
 */
export declare function resolveSystems(
  prj: Project,
  script: PromptSystemOptions &
    ModelOptions &
    ContentSafetyOptions & {
      jsSource?: string;
    },
  resolvedTools?: ToolCallback[],
): SystemPromptInstance[];
/**
 * Adds fallback tool systems to the provided list of systems based on tool configuration
 * and model/tool support. Ensures "system.tool_calls" is included if fallback tools
 * are required and tools are unsupported.
 *
 * @param systems - The current list of system prompt instances where fallback tools might be added.
 * @param tools - The list of tools to evaluate for inclusion of fallback systems.
 * @param options - Optional model-specific generation options containing fallback tool settings.
 * @param genOptions - Optional general generation options containing fallback tool configurations.
 * @returns A boolean indicating if fallback tools were added.
 */
export declare function addFallbackToolSystems(
  systems: SystemPromptInstance[],
  tools: ToolCallback[],
  options?: ModelOptions,
  genOptions?: GenerationOptions,
): boolean;
/**
 * Resolves tools in the project based on provided systems and tools.
 * Matches system IDs or instances and tool IDs against project scripts to find associated tools.
 *
 * @param prj - The project containing templates and script data, including scripts and tool definitions.
 * @param systems - A list of system IDs or instances to resolve tools for.
 * @param tools - A list of tool IDs to match against project scripts.
 * @returns A list of tool objects, each containing an ID and description, associated with the provided systems and tools.
 */
export declare function resolveTools(
  prj: Project,
  systems: (string | SystemPromptInstance)[],
  tools: string[],
): {
  id: string;
  description: string;
}[];
//# sourceMappingURL=systems.d.ts.map
