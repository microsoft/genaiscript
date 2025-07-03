# Agentic Search Implementation

This document describes the implementation of the agentic search feature in GenAIScript.

## Overview

Agentic search is an intelligent retrieval system that combines multiple search strategies with AI-powered query rewriting to provide comprehensive and relevant search results. It's designed to enhance RAG (Retrieval-Augmented Generation) workflows by leveraging the strengths of different search methodologies.

## Architecture

### Core Components

1. **Query Rewriting Engine**: Uses LLM to generate multiple query variations
2. **Multi-Strategy Search**: Executes vector, web, and fuzzy searches in parallel
3. **Result Fusion**: Combines results using advanced ranking algorithms
4. **Runtime Integration**: Available through the retrieval interface

### Files Structure

```
packages/core/src/
├── agenticsearch.ts                 # Core implementation
├── agenticsearch.test.ts           # Integration tests
├── agenticsearch.internals.test.ts # Unit tests for algorithms
├── promptcontext.ts                # Runtime integration
└── types/prompt_template.d.ts      # Type definitions

packages/cli/genaisrc/
└── system.retrieval_agentic_search.genai.mts  # System prompt tool

packages/sample/genaisrc/
└── agentic-search-demo.genai.mts   # Usage example

docs/src/content/docs/reference/scripts/
└── retrieval.mdx                   # Documentation
```

## Key Features

### 1. Query Rewriting
- Generates multiple query variations using LLM
- Improves search coverage by exploring different phrasings
- Handles synonyms, related concepts, and alternative formulations
- Graceful fallback if rewriting fails

### 2. Multi-Strategy Search
- **Vector Search**: Semantic similarity using embeddings
- **Web Search**: Live web results via Bing/Tavily APIs
- **Fuzzy Search**: Traditional keyword-based search
- Parallel execution for optimal performance

### 3. Result Fusion Algorithms

#### Weighted Strategy (Default)
- Applies configurable weights to each search type
- Deduplicates results by filename/content
- Simple and effective for most use cases

#### Reciprocal Rank Fusion (RRF)
- Academic-grade fusion algorithm
- Considers rank positions across different search results
- Optimal for combining diverse result sets

#### Simple Strategy
- Basic concatenation with deduplication
- Preserves original scores
- Fastest processing option

### 4. Configuration Options

```typescript
interface AgenticSearchOptions {
    topK?: number                    // Result limit (default: 10)
    minScore?: number               // Score threshold (default: 0)
    queryVariations?: number        // Query variants (default: 2)
    combinationStrategy?: string    // "weighted" | "rrf" | "simple"
    includeWebSearch?: boolean      // Enable web search
    includeVectorSearch?: boolean   // Enable vector search
    includeFuzzSearch?: boolean     // Enable fuzzy search
    searchWeights?: {              // Custom weights
        vector?: number
        web?: number
        fuzzy?: number
    }
    webSearchProvider?: string      // "bing" | "tavily"
    embeddingsModel?: string        // Vector model
    indexName?: string             // Vector index
}
```

## Usage Patterns

### 1. Direct API Usage
```javascript
const results = await retrieval.agenticSearch(
    "machine learning algorithms",
    files,
    {
        topK: 5,
        combinationStrategy: "rrf",
        searchWeights: { vector: 0.6, web: 0.3, fuzzy: 0.1 }
    }
)
```

### 2. Tool Usage (for LLMs)
```javascript
system: ["system.retrieval_agentic_search"]
// LLM can now use agentic_search tool automatically
```

### 3. Custom Workflows
```javascript
// High-precision scientific search
const scientificResults = await retrieval.agenticSearch(query, papers, {
    includeWebSearch: false,
    includeVectorSearch: true,
    includeFuzzSearch: false,
    queryVariations: 5,
    minScore: 0.7
})

// Comprehensive research search
const researchResults = await retrieval.agenticSearch(query, docs, {
    combinationStrategy: "rrf",
    queryVariations: 4,
    searchWeights: { vector: 0.4, web: 0.4, fuzzy: 0.2 }
})
```

## Performance Considerations

### Parallel Execution
- All search strategies execute concurrently
- Network requests (web search) don't block local searches
- Configurable timeouts and error handling

### Caching
- Query rewriting results are cached
- Vector embeddings leverage existing caching
- Intermediate results can be cached per strategy

### Scalability
- Supports large document collections
- Efficient deduplication algorithms
- Configurable result limits prevent memory issues

## Error Handling

### Graceful Degradation
- Individual search failures don't break the entire process
- Missing providers are handled transparently
- Query rewriting failures fall back to original query

### Error Reporting
- Detailed trace logging for debugging
- Clear error messages for configuration issues
- Cancellation token support for long operations

## Testing Strategy

### Unit Tests
- Individual algorithm testing (combination strategies)
- Mock-based testing for external dependencies
- Edge case coverage (empty results, failures)

### Integration Tests
- End-to-end workflow testing
- Real search provider integration
- Performance benchmarking

### Example Scripts
- Practical usage demonstrations
- Configuration examples
- Best practices illustration

## Future Enhancements

### Potential Improvements
1. **Adaptive Weighting**: Learn optimal weights from user feedback
2. **Query Planning**: AI-driven search strategy selection
3. **Result Explanation**: Provide reasoning for result rankings
4. **Custom Fusion**: Allow user-defined combination algorithms
5. **Streaming Results**: Return results as they become available
6. **Semantic Clustering**: Group similar results together

### Research Opportunities
1. **Reinforcement Learning**: Optimize search strategies based on outcomes
2. **Federated Search**: Integrate with enterprise search systems
3. **Multi-Modal Search**: Support image and audio content
4. **Context-Aware Search**: Use conversation history for query enhancement

## Implementation Notes

### Design Decisions
1. **Modular Architecture**: Easy to extend with new search strategies
2. **Type Safety**: Full TypeScript support with comprehensive interfaces
3. **Runtime Integration**: Seamless integration with existing GenAIScript workflow
4. **Configuration-Driven**: Extensive customization without code changes

### Technical Trade-offs
1. **Complexity vs. Flexibility**: Rich configuration options increase complexity
2. **Performance vs. Comprehensiveness**: More strategies = better results but slower execution
3. **Memory vs. Speed**: Result caching improves speed but uses more memory

This implementation provides a production-ready agentic search system that significantly enhances GenAIScript's retrieval capabilities while maintaining simplicity for basic use cases and providing extensive customization for advanced users.