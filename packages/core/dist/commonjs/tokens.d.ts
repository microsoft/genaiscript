/**
 * Estimates the token count of a given text by dividing its length
 * by an approximate token length and adding a constant overhead.
 *
 * If an encoder is provided and the text length is below a threshold,
 * uses the encoder for a more accurate estimate.
 *
 * @param text The input text to estimate tokens for. If empty, returns 0.
 * @param options Optional parameters:
 *   - overcount: Adjusts the token length by subtracting this value from 4. Defaults to 0.
 *   - encoder: Optional encoder function for more accurate estimation on short texts.
 * @returns The estimated token count, including overhead.
 */
export declare function approximateTokens(
  text: string,
  options?: {
    overcount?: number;
    encoder?: TokenEncoder;
  },
): number;
/**
 * Estimates the number of tokens in a given text using a provided encoder function.
 * Includes a constant overhead in the result.
 *
 * @param text - The input text to estimate tokens for. If empty or undefined, returns 0.
 * @param encoder - A function that encodes the text into tokens.
 * @returns The estimated token count, including overhead. If an error occurs during encoding, falls back to an approximate token count.
 */
export declare function estimateTokens(text: string, encoder: TokenEncoder): number;
/**
 * /NO P/
 */
export declare function truncateTextToTokens(
  content: string,
  maxTokens: number,
  encoder: TokenEncoder,
  options?: {
    tokens?: number;
    last?: boolean;
    threshold?: number;
  },
): string;
//# sourceMappingURL=tokens.d.ts.map
