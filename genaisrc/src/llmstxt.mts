export async function init() {
  const configFilename = "./llmstxt.json";
  const defaultCacheName = "llmstxt";

  const config: {
    docs: Record<string, { url: string }>;
    indexName?: string;
    indexOptions?: VectorIndexOptions;
    searchOptions?: VectorSearchOptions;
  } = await workspace.readJSON(configFilename);
  if (!config) {
    await workspace.writeText(configFilename, JSON.stringify({ urls: {} }, null, 2));
    cancel(`please configure ${configFilename} with urls`);
  }
  const {
    docs,
    indexName = "llmstxt",
    indexOptions = {
      cacheName: defaultCacheName,
      chunkSize: 500,
      chunkOverlap: 100,
      maxTokens: 7000,
      type: "local",
    },
    searchOptions = {
      topK: 40,
    },
  } = config;
  const index = await retrieval.index(indexName, indexOptions);

  return { docs, index, searchOptions };
}
