/**
 * Chain of Debate: Programming Languages with Curly Braces vs Others
 *
 * This script demonstrates the Chain of Debate pattern by having multiple
 * AI models debate whether programming languages that use curly braces { }
 * are better than those that don't (like Python, Ruby, etc.).
 */

import { chainOfDebate } from "@genaiscript/runtime";

// Define the debate topic
const topic =
  "Programming languages that use curly braces { } for code blocks are superior to those that use indentation or other syntactic approaches";

// Run the chain of debate
const result = await chainOfDebate(topic, {
  models: ["large", "small", "openai:gpt-4o"], // Use different models for diverse perspectives
  rounds: 4, // More rounds for a thorough debate
  synthesize: true, // Include final synthesis
});

// Format the results for pretty printing
$`# 🎭 Chain of Debate: Curly Braces vs. Alternative Syntax

**Topic:** ${result.topic}

**Participants:** ${result.models.join(", ")}

**Rounds:** ${result.rounds}

---

`;

// Group debate history by rounds
const roundsMap = new Map<number, any[]>();
result.debateHistory.forEach((entry: any) => {
  if (!roundsMap.has(entry.round)) {
    roundsMap.set(entry.round, []);
  }
  roundsMap.get(entry.round)!.push(entry);
});

// Display each round
for (let round = 1; round <= result.rounds; round++) {
  const entries = roundsMap.get(round) || [];
  $`## 🔄 Round ${round}

`;

  entries.forEach((entry, index) => {
    $`### 🤖 Model: ${entry.model}

${entry.position}

`;
    if (index < entries.length - 1) {
      $`---

`;
    }
  });
  $`
`;
}

// Add synthesis if available
if (result.synthesis) {
  $`## 🎯 Final Synthesis

${result.synthesis}

`;
}

// Add debate statistics
$`## 📊 Debate Statistics

- **Total Exchanges:** ${result.debateHistory.length}
- **Models Participated:** ${result.models.length}
- **Debate Rounds:** ${result.rounds}
- **Synthesis Included:** ${result.synthesis ? "Yes" : "No"}

---

*This debate was generated using the GenAIScript Chain of Debate pattern.*
`;


