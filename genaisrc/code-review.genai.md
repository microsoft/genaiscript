---
title: "Code Review Assistant"
description: "Provides detailed code review feedback and suggestions"
model: "large"
temperature: 0.3
maxTokens: 2000
---

# Code Review

Please conduct a thorough code review of the provided files. Focus on the following aspects:

## Code Quality
- **Readability**: Is the code easy to understand and well-documented?
- **Structure**: Is the code well-organized with clear separation of concerns?
- **Naming**: Are variables, functions, and classes named clearly and consistently?

## Best Practices
- **Language Conventions**: Does the code follow established conventions for the programming language?
- **Design Patterns**: Are appropriate design patterns used where beneficial?
- **Error Handling**: Is error handling implemented properly and consistently?

## Performance & Security
- **Performance**: Are there any obvious performance bottlenecks or optimization opportunities?
- **Security**: Are there any potential security vulnerabilities or concerns?
- **Resource Usage**: Is memory and other resource usage efficient?

## Testing & Maintainability
- **Testability**: Is the code structured in a way that makes it easy to test?
- **Maintainability**: Will this code be easy to modify and extend in the future?
- **Dependencies**: Are external dependencies used appropriately and minimally?

## Output Format

For each file reviewed, please provide:

1. **Overall Assessment**: Brief summary of code quality (Good/Needs Improvement/Poor)
2. **Specific Issues**: List concrete problems found with line numbers if applicable
3. **Suggestions**: Actionable recommendations for improvement
4. **Positive Notes**: Highlight what was done well

Be constructive and specific in your feedback. Provide code examples for suggested improvements when helpful.
