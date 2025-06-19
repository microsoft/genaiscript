import { parse, evaluate } from "groq-js";
/**
 * Loads and applies a GROQ query transformation to the input dataset.
 * @param query GROQ query string to parse and evaluate.
 * @param dataset The input dataset to apply the query to. Returns undefined if not provided.
 * @param options Optional configurations such as root and query parameters.
 */
export async function GROQEvaluate(
  query: string,
  dataset: any,
  options?: {
    root?: any;
    params?: Record<string, unknown>;
  },
): Promise<any> {
  if (dataset === undefined) return dataset;

  const tree = parse(query);
  const value = await evaluate(tree, { dataset, ...(options || {}) });
  const res = await value.get();
  return res;
}
