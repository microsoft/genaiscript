interface CowsayOptions {
  text: string;
  mode?: "say" | "think";
  eyes?: string;
  tongue?: string;
}

export function cowsay(options: CowsayOptions | string): string {
  // Handle string argument
  const opts: CowsayOptions = typeof options === "string" ? { text: options } : options;

  // Default options
  const { text = "", mode = "say", eyes = "oo", tongue = "  " } = opts;

  // Split text into lines
  const lines = formatText(text);

  // Create the speech bubble
  const bubble = createBubble(lines, mode);

  // Create the cow
  const cow = createCow(eyes, tongue, mode);

  // Combine the bubble and cow
  return bubble + cow;
}

function formatText(text: string, maxWidth: number = 40): string[] {
  if (!text) return [""];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function createBubble(lines: string[], mode: "say" | "think"): string {
  if (lines.length === 0) return "";

  const maxLength = Math.max(...lines.map((line) => line.length));
  let result = " " + "_".repeat(maxLength + 2) + "\n";

  if (lines.length === 1) {
    const line = lines[0];
    const padding = " ".repeat(maxLength - line.length);
    result += mode === "say" ? `< ${line}${padding} >\n` : `( ${line}${padding} )\n`;
  } else {
    lines.forEach((line, i) => {
      const padding = " ".repeat(maxLength - line.length);
      let prefix, suffix;

      if (i === 0) {
        prefix = mode === "say" ? "/ " : "( ";
        suffix = mode === "say" ? " \\" : " )";
      } else if (i === lines.length - 1) {
        prefix = mode === "say" ? "\\ " : "( ";
        suffix = mode === "say" ? " /" : " )";
      } else {
        prefix = mode === "say" ? "| " : "( ";
        suffix = mode === "say" ? " |" : " )";
      }

      result += `${prefix}${line}${padding}${suffix}\n`;
    });
  }

  result += " " + "-".repeat(maxLength + 2) + "\n";
  return result;
}

/**
 * Create the ASCII cow
 */
function createCow(eyes: string, tongue: string, mode: "say" | "think"): string {
  return `        \\   ^__^
           \\  (${eyes})\\_______
              (__)\\       )\\/\\
               ${tongue}||----w |
                  ||     ||
  `;
}

export function cowthink(options: CowsayOptions | string): string {
  const opts = typeof options === "string" ? { text: options } : options;
  return cowsay({ ...opts, mode: "think" });
}
