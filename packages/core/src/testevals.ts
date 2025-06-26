/**
 * Test evaluation functions for GenAIScript tests
 * Implements fact assertion using classify runtime helper for LLM-based evaluation
 */

import { classify } from "../../cli/src/runtime"

/**
 * Options for fact evaluation
 */
export interface FactEvaluationOptions {
    /**
     * Context for running the evaluation
     */
    ctx?: ChatGenerationContext
    /**
     * Model to use for evaluation
     */
    model?: string
    /**
     * Whether to provide explanations
     */
    explanations?: boolean
}

/**
 * Result of fact evaluation
 */
export interface FactEvaluationResult {
    /**
     * Whether the fact is supported by the output
     */
    pass: boolean
    /**
     * Confidence score (0-1)
     */
    score?: number
    /**
     * Explanation of the evaluation
     */
    explanation?: string
    /**
     * Additional metadata from classification
     */
    metadata?: {
        label: string
        probPercent?: number
        entropy?: number
        logprob?: number
    }
}

/**
 * Evaluates whether the output supports a given fact using LLM-based classification
 * 
 * @param output - The LLM output text to evaluate
 * @param fact - The fact statement to check against the output
 * @param options - Evaluation options
 * @returns Promise resolving to evaluation result
 */
export async function evaluateFact(
    output: string,
    fact: string,
    options?: FactEvaluationOptions
): Promise<FactEvaluationResult> {
    const { ctx, model = "large", explanations = true } = options || {}

    // Define classification labels for factual consistency evaluation
    const labels = {
        supported: "The output fully supports or confirms the given fact",
        contradicts: "The output contradicts or denies the given fact", 
        insufficient: "The output does not provide enough information to determine if the fact is true or false",
        irrelevant: "The output is not relevant to the given fact"
    }

    try {
        // Use classify to determine factual relationship
        const result = await classify(
            `## Output to Evaluate:
${output}

## Fact to Check:
${fact}

## Task:
Evaluate whether the output supports, contradicts, or provides insufficient information about the given fact. Consider the semantic meaning and context.`,
            labels,
            {
                explanations,
                ctx,
                model,
            }
        )

        // Determine pass/fail based on classification
        const pass = result.label === "supported"
        
        return {
            pass,
            score: result.probPercent ? result.probPercent / 100 : undefined,
            explanation: result.answer,
            metadata: {
                label: result.label as string,
                probPercent: result.probPercent,
                entropy: result.entropy,
                logprob: result.logprob,
            }
        }
    } catch (error) {
        throw new Error(`Fact evaluation failed: ${error.message}`)
    }
}

/**
 * Evaluates multiple facts against an output
 * 
 * @param output - The LLM output text to evaluate
 * @param facts - Array of fact statements to check
 * @param options - Evaluation options
 * @returns Promise resolving to array of evaluation results
 */
export async function evaluateFacts(
    output: string,
    facts: string[],
    options?: FactEvaluationOptions
): Promise<FactEvaluationResult[]> {
    const results: FactEvaluationResult[] = []
    
    for (const fact of facts) {
        const result = await evaluateFact(output, fact, options)
        results.push(result)
    }
    
    return results
}

/**
 * Promptfoo-compatible fact evaluator function
 * This function can be used as a custom assertion in promptfoo configurations
 * 
 * @param output - The output from the LLM
 * @param expected - The expected fact (passed as the assertion value)
 * @returns Promise resolving to promptfoo assertion result
 */
export async function factualityEvaluator(output: any, expected: string): Promise<{
    pass: boolean
    score: number
    reason: string
}> {
    try {
        // Extract text from output (handle different output formats)
        const outputText = typeof output === 'string' ? output : 
                          output?.text || 
                          JSON.stringify(output)
        
        const result = await evaluateFact(outputText, expected, {
            explanations: true,
            model: "large"
        })
        
        return {
            pass: result.pass,
            score: result.score || (result.pass ? 1 : 0),
            reason: result.explanation || `Fact evaluation: ${result.metadata?.label || 'unknown'}`
        }
    } catch (error) {
        return {
            pass: false,
            score: 0,
            reason: `Fact evaluation error: ${error.message}`
        }
    }
}