# Chain of Debate - Example Output

This demonstrates what the chain-of-debate sample would produce when run.

## Example 1: Simple Math Question

**Input:**
```bash
genaiscript run chain-of-debate --vars question="What is 2 + 3?"
```

**Expected Output:**
```
🤔 Question: What is 2 + 3?
🔄 Max rounds: 6
🤖 Models: openai:gpt-4o-mini, openai:gpt-3.5-turbo

=== Round 1 ===
(Exploration phase: Each AI shares their perspective)

--- openai:gpt-4o-mini responds ---
To solve this problem, I need to add the two numbers together.

2 + 3 = 5

This is a basic arithmetic operation. Adding 2 and 3 gives us 5.

Answer: 5

--- openai:gpt-3.5-turbo responds ---
This is a straightforward addition problem.

2 + 3 = 5

The answer is clearly 5.

Answer: 5

🤝 openai:gpt-4o-mini and openai:gpt-3.5-turbo agree on: 5

==================================================
🎯 FINAL ANSWER
==================================================
5

## Chain of Debate Results

**Question:** What is 2 + 3?

**Models:** openai:gpt-4o-mini, openai:gpt-3.5-turbo

**Rounds:** 6

**Final Answer:** 5

---

The chain of debate process allows multiple AI models to discuss and refine their perspectives through structured rounds of exploration and reflection, ultimately working toward consensus or identifying the most reasoned position.
```

## Example 2: More Complex Question

**Input:**
```bash
genaiscript run chain-of-debate --vars question="Should AI development be regulated?" --vars maxRounds=4
```

**Expected Behavior:**
1. **Round 1-2 (Exploration)**: Each model presents their perspective on AI regulation
2. **Round 3-4 (Reflection)**: Models consider each other's viewpoints and potentially reach consensus
3. **Agreement Detection**: If models explicitly agree or provide semantically equivalent answers, debate concludes early
4. **Final Output**: Structured summary with the final consensus or best reasoned position

## Key Features Demonstrated

- **Multi-round discussion** with distinct exploration and reflection phases
- **Automatic consensus detection** ending debate when agreement is reached
- **Context awareness** where each model sees previous responses
- **Structured output** showing the complete debate process
- **Configurable parameters** for questions, rounds, and models