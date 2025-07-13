import { titleize } from "./inflection.js";
import { fenceMD } from "./mkmd.js";

/**
 * Converts an object to a markdown string with options for quoting values, limiting heading levels, and customizing indentation.
 * Handles circular references by replacing them with ellipses.
 * Supports rendering arrays, objects, and strings with optional quoting.
 * @param obj - The object to convert.
 * @param options - Optional settings for quoting string values, maximum heading depth, and base heading level.
 * @returns The markdown representation of the object.
 */
export function markdownStringify(
  obj: any,
  options?: {
    quoteValues?: boolean;
    headings?: number;
    headingLevel?: number;
  },
): string {
  const seen = new Set<any>();
  const { quoteValues, headings = -1, headingLevel = 2 } = options || {};
  const render = (obj: any, depth: number): string => {
    if (obj === undefined || obj === null) return obj;

    const indent = depth;
    if (Array.isArray(obj)) {
      if (seen.has(obj)) return "...";
      seen.add(obj);
      const items = obj.map((o) => render(o, depth + 1)).filter((i) => i !== undefined && i !== "");
      if (items.some((i) => i.includes("\n")))
        return `\n<ul>\n${items.map((item) => `<li>\n${item}\n</li>\n`).join("\n")}\n</ul>\n`;
      else {
        const indentText = "  ".repeat(indent);
        return "\n" + items.map((item) => `${indentText}- ${item}`).join("\n");
      }
    } else if (typeof obj === "object") {
      if (seen.has(obj)) return "...";
      seen.add(obj);

      const entries = Object.entries(obj)
        .map((kv) => [kv[0], render(kv[1], depth + 1)])
        .filter((kv) => kv[1] !== undefined);
      if (depth <= headings) {
        return entries
          .map((kv) => `\n${"#".repeat(headingLevel + depth)} ${titleize(kv[0])}\n${kv[1]}`)
          .join("\n");
      } else if (entries.some((kv) => kv[1].includes("\n")))
        return `\n<ul>\n${entries.map((kv) => `<li>\n${kv[0]}: ${kv[1]}\n</li>\n`).join("\n")}\n</ul>\n`;
      else {
        const indentText = "  ".repeat(indent);
        return "\n" + entries.map((kv) => `${indentText}- ${kv[0]}: ${kv[1]}`).join("\n");
      }
    } else if (typeof obj === "string") {
      if (quoteValues) {
        if (obj.includes("\n")) return fenceMD(obj);
        return `\`${obj.replace(/`/g, "\\`")}\``;
      } else return obj;
    } else return quoteValues ? `\`${String(obj).replace(/`/g, "\\`")}\`` : String(obj);
  };

  return render(obj, 0) + "\n";
}
