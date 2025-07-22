# Chain of Debate Sample

This GenAIScript sample implements a chain of debate between multiple AI models to reach consensus through structured discussion.

## Inspiration

Based on the [chain-of-debate](https://github.com/sukeesh/chain-of-debate/blob/main/main.py) Python implementation, this sample demonstrates how multiple AI models can engage in a structured debate to improve reasoning and reach better answers.

## How it Works

1. **Multi-Round Debate**: Multiple AI models engage in several rounds of discussion
2. **Exploration Phase**: Early rounds focus on each model presenting their perspective
3. **Reflection Phase**: Later rounds focus on considering all viewpoints and finding consensus
4. **Agreement Detection**: The system automatically detects when models explicitly agree
5. **Semantic Equivalence**: When models provide semantically equivalent answers, the debate concludes
6. **Early Termination**: The debate ends when consensus is reached, avoiding unnecessary rounds

## Usage

### Basic Usage

Run the script with default parameters:
```bash
genaiscript run chain-of-debate
```

### Custom Parameters

You can customize the debate with various parameters:

```bash
# Custom question
genaiscript run chain-of-debate --vars question="What are the benefits of renewable energy?"

# Different models
genaiscript run chain-of-debate --vars models='["openai:gpt-4o", "anthropic:claude-3-sonnet"]'

# More rounds
genaiscript run chain-of-debate --vars maxRounds=8

# Combined
genaiscript run chain-of-debate \
  --vars question="Should AI development be regulated?" \
  --vars maxRounds=4 \
  --vars models='["openai:gpt-4o", "openai:gpt-3.5-turbo", "anthropic:claude-3-haiku"]'
```

## Parameters

- **question**: The question or problem to debate (string)
- **maxRounds**: Maximum number of debate rounds (number, default: 6)
- **models**: Array of model names to use in the debate (array, default: ["openai:gpt-4o-mini", "openai:gpt-3.5-turbo"])

## Features

- **Multi-Model Support**: Works with any combination of supported models
- **Automatic Consensus Detection**: Stops when models agree or provide equivalent answers
- **Round-Based Discussion**: Structured approach with exploration and reflection phases
- **Context Passing**: Each model sees the previous model's response
- **Comprehensive Output**: Detailed results showing the debate process and final answer

## Example Output

The script produces a structured output showing:
- Each round of debate
- Individual model responses
- Agreement detection
- Final consensus or best answer
- Summary of the debate process

This demonstrates how different AI models can collaborate and improve reasoning through structured discussion.