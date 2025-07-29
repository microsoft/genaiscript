import { genaiscriptDebug } from "@genaiscript/core";

const dbg = genaiscriptDebug("runtime");

export interface ChainOfDebateOptions {
  /** List of models to participate in the debate */
  models?: string[];
  /** Number of debate rounds */
  rounds?: number;
  /** Whether to include a final synthesis */
  synthesize?: boolean;
}

export interface ChainOfDebateResult {
  topic: string;
  models: string[];
  rounds: number;
  debateHistory: Array<{
    round: number;
    model: string;
    position: string;
    reasoning: string;
  }>;
  synthesis?: string;
}

/**
 * Chain of Debate - Multi-Agent Debate System
 *
 * This script implements a chain of debate pattern where multiple LLM models
 * engage in iterative rounds of debate on a given topic, building on each
 * other's arguments to reach a more refined conclusion.
 *
 * Inspired by: https://github.com/sukeesh/chain-of-debate/blob/main/main.py
 */
export async function chainOfDebate(
  topic: string,
  options: ChainOfDebateOptions,
): Promise<ChainOfDebateResult> {
  const { models = ["large", "small"], rounds = 3, synthesize = true } = options;

  dbg(`🎯 Starting Chain of Debate on: "${topic}"`);
  dbg(`🤖 Models: ${models.join(", ")}`);
  dbg(`🔄 Rounds: ${rounds}`);

  // Initialize debate state
  const debateHistory: Array<{
    round: number;
    model: string;
    position: string;
    reasoning: string;
  }> = [];

  // Round 1: Initial positions
  dbg("\n🚀 Round 1: Initial Positions");
  const initialPositions = await Promise.all(
    models.map(async (model, index) => {
      const { text } = await runPrompt(
        (_) => {
          const topicRef = _.def("TOPIC", topic);
          _.$`You are participating in a structured debate on the topic ${topicRef}.

Please provide your initial position on this topic. Your response should include:
1. Your clear stance/position
2. Key arguments supporting your position
3. Evidence or reasoning behind your arguments

Be thoughtful, well-reasoned, and prepare to defend your position in subsequent rounds.

Format your response as:
**Position:** [Your clear stance]
**Arguments:** [Numbered list of key arguments]
**Reasoning:** [Detailed explanation of your logic]`;
        },
        {
          model,
          label: `debate-initial-${index + 1}`,
          cache: "chain-of-debate",
        },
      );

      const position = {
        round: 1,
        model,
        position: text,
        reasoning: text,
      };

      debateHistory.push(position);
      dbg(`\n📝 ${model}:`);
      dbg(text.substring(0, 200) + "...");

      return position;
    }),
  );

  // Iterative debate rounds
  for (let round = 2; round <= rounds; round++) {
    dbg(`\n🔄 Round ${round}: Responses and Rebuttals`);

    const roundResponses = await Promise.all(
      models.map(async (model, index) => {
        // Get other participants' latest positions
        const otherPositions = debateHistory
          .filter((entry) => entry.round === round - 1 && entry.model !== model)
          .map((entry, idx) => `**Participant ${idx + 1} (${entry.model}):**\n${entry.position}`)
          .join("\n\n");

        const { text } = await runPrompt(
          (_) => {
            const topicRef = _.def("TOPIC", topic);
            const previousPositionsRef = _.def(
              "PREVIOUS_POSITION",
              debateHistory.find((entry) => entry.model === model && entry.round === round - 1)
                ?.position,
            );
            const otherPositionsRef = _.def("OTHER_POSITIONS", otherPositions);
            _.$`You are continuing a structured debate on: ${topicRef}

Your previous position was ${previousPositionsRef}.

In ${otherPositionsRef} are the other participants' positions from the previous round in 

Now provide your response for Round ${round}. You should:
1. Address key points raised by other participants
2. Defend or refine your position based on their arguments
3. Present counter-arguments where appropriate
4. Acknowledge valid points made by others
5. Strengthen your overall argument

Format your response as:
**Refined Position:** [Your updated stance]
**Response to Others:** [Address specific points from other participants]
**Counter-Arguments:** [Challenge opposing views]
**Strengthened Reasoning:** [Enhanced logic and evidence]`;
          },
          {
            model,
            label: `debate-round-${round}-${index + 1}`,
            cache: "chain-of-debate",
          },
        );

        const position = {
          round,
          model,
          position: text,
          reasoning: text,
        };

        debateHistory.push(position);
        dbg(`\n📝 ${model} (Round ${round}):`);
        dbg(text.substring(0, 200) + "...");

        return position;
      }),
    );
  }

  // Final synthesis (if enabled)
  let synthesis = "";
  if (synthesize) {
    dbg("\n🎯 Final Synthesis");

    const { text } = await runPrompt(
      (_) => {
        const topicRef = _.def("TOPIC", topic);
        const debateRef = _.def(
          "DEBATE_HISTORY",
          debateHistory
            .map((entry) => `**Round ${entry.round} - ${entry.model}:**\n${entry.position}`)
            .join("\n\n---\n\n"),
        );
        _.$`You are an impartial moderator analyzing a structured debate on ${topicRef}.

The debate involved ${models.length} participants over ${rounds} rounds. The complete debate history is in ${debateHistory}.

Please provide a comprehensive synthesis that:
1. Summarizes the key positions and how they evolved
2. Identifies areas of convergence and persistent disagreements
3. Evaluates the strength of different arguments
4. Provides a balanced conclusion that incorporates the best insights
5. Suggests potential areas for further exploration

Format your response as:
**Evolution of Debate:** [How positions changed over rounds]
**Key Insights:** [Most compelling arguments and evidence]
**Areas of Agreement:** [Where participants converged]
**Remaining Disagreements:** [Persistent differences]
**Balanced Conclusion:** [Synthesized perspective]
**Further Questions:** [Areas needing more exploration]`;
      },
      {
        model: "large",
        label: "debate-synthesis",
        cache: "chain-of-debate",
      },
    );

    synthesis = text;
    dbg("\n📊 Synthesis:");
    dbg(text.substring(0, 300) + "...");
  }

  return {
    topic,
    models,
    rounds,
    debateHistory,
    synthesis,
  };
}
