// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { ChatGenerationContextOptions } from "@genaiscript/core";
import { resolveChatGenerationContext } from "@genaiscript/core";

/**
 * Enhances content generation by applying iterative improvements.
 *
 * @param options - Configuration for the improvement process.
 * @param options.ctx - Chat generation context to use. Defaults to the environment generator if not provided.
 * @param options.repeat - Number of improvement iterations to perform. Defaults to 1.
 * @param options.instructions - Custom instructions for improvement. Defaults to "Make it better!".
 * The instructions are applied in each iteration.
 */
export function makeItBetter(
  options?: ChatGenerationContextOptions & {
    repeat?: number;
    instructions?: string;
  },
) {
  const ctx = resolveChatGenerationContext(options);
  const { repeat = 1, instructions = "Make it better!" } = options || {};

  let round = 0;
  ctx.defChatParticipant((cctx) => {
    if (round++ < repeat) {
      cctx.console.log(`make it better (round ${round})`);
      cctx.$`${instructions}`;
    }
  });
}
