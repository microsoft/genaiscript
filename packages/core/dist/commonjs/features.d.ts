export declare function providerFeatures(provider: string): {
  id: string;
  detail: string;
  url?: string;
  seed?: boolean;
  logitBias?: boolean;
  tools?: boolean;
  logprobs?: boolean;
  topLogprobs?: boolean;
  topP?: boolean;
  toolChoice?: boolean;
  prediction?: boolean;
  bearerToken?: boolean;
  listModels?: boolean;
  transcribe?: boolean;
  speech?: boolean;
  tokenless?: boolean;
  hidden?: boolean;
  imageGeneration?: boolean;
  singleModel?: boolean;
  metadata?: boolean;
  responseType?: "json" | "json_object" | "json_schema";
  reasoningEfforts?: Record<string, number>;
  aliases?: Record<string, string>;
  models?: Record<
    string,
    {
      tools?: boolean;
    }
  >;
  env?: Record<
    string,
    {
      description?: string;
      secret?: boolean;
      required?: boolean;
      format?: string;
      enum?: string[];
    }
  >;
};
//# sourceMappingURL=features.d.ts.map
