import Mustache from "mustache";
/**
 * Processes a markdown string by applying Mustache or Jinja templating.
 * Removes frontmatter, prompty roles, and XML tags before interpolation.
 * @param md The markdown string to process.
 * @param data The data for variable interpolation.
 * @param options Configuration for templating format, e.g., Mustache or Jinja.
 * @returns The processed markdown string with interpolated variables.
 */
export declare function interpolateVariables(
  md: string,
  data: Record<string, any>,
  options?: ImportTemplateOptions,
): Promise<string>;
export declare const mustacheRender: typeof Mustache.render;
//# sourceMappingURL=mustache.d.ts.map
