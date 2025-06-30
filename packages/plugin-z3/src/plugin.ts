import type { ChatGenerationContextOptions } from "@genaiscript/core";
import { resolveChatGenerationContext } from "@genaiscript/core";
import { z3 } from "./z3.js";

/**
 * Import the z3 tool into the prompt generation context.
 */
export function plugin(options?: ChatGenerationContextOptions) {
  const { defTool } = resolveChatGenerationContext(options);

  defTool(
    "z3",
    "Solves a SMTLIB2 problem using the Z3 constraint solver. Send problems one at a time. Use this tool if you need to run Z3.",
    {
      type: "object",
      properties: {
        smtlib2: {
          type: "string",
          description: "SMTLIB2 problem to solve",
        },
      },
      required: ["smtlib2"],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const { smtlib2 } = args as { smtlib2: string };
      const z3lib = await z3();
      const result = await z3lib.run(smtlib2);
      return result;
    },
  );
}
