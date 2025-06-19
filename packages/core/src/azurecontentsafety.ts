import { createFetch, statusToMessage } from "./fetch";
import { TraceOptions } from "./trace";
import { arrayify } from "./util";
import {
  AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH,
  DOCS_CONFIGURATION_CONTENT_SAFETY_URL,
} from "./constants";
import { runtimeHost } from "./host";
import { CancellationOptions } from "./cancellation";
import { YAMLStringify } from "./yaml";
import { AzureCredentialsType } from "./server/messages";
import { trimTrailingSlash } from "./cleaners";
import { chunkString } from "./chunkers";
import { createCache } from "./cache";
import { traceFetchPost } from "./fetchtext";
import { genaiscriptDebug } from "./debug";
const dbg = genaiscriptDebug("contentsafety:azure");

interface AzureContentSafetyRequest {
  userPrompt?: string;
  documents?: string[];
}

interface AzureContentSafetyResponse {
  userPromptAnalysis: {
    attackDetected: boolean;
  };
  documentsAnalysis: {
    attackDetected: boolean;
  }[];
}

class AzureContentSafetyClient implements ContentSafety {
  readonly id: "azure";
  private readonly cache: WorkspaceFileCache<
    { route: string; body: object; options: object },
    object
  >;
  constructor(readonly options?: TraceOptions & CancellationOptions) {
    this.cache = createCache("azurecontentsafety", {
      ...(options || {}),
      type: "fs",
    });
  }

  async detectHarmfulContent(
    content: Awaitable<string | WorkspaceFile>,
    options?: {
      maxAllowedSeverity?: number;
    },
  ): Promise<{
    harmfulContentDetected: boolean;
    filename?: string;
    chunk?: string;
  }> {
    const { trace } = this.options || {};
    const { maxAllowedSeverity = 0 } = options || {};
    const route = "text:analyze";

    try {
      dbg(`detecting harmful content`);
      trace?.startDetails("🛡️ content safety: detecting harmful content");

      const fetcher = await this.createClient(route);
      const analyze = async (text: string) => {
        trace?.fence(YAMLStringify(text), "yaml");
        const body = { text };
        const cached = await this.cache.get({ route, body, options });
        if (cached) {
          trace?.itemValue("cached", YAMLStringify(cached));
          return cached as { harmfulContentDetected: boolean };
        }

        const res = await fetcher(body);
        if (!res.ok) {
          dbg(statusToMessage(res));
          throw new Error(`Azure Content Safety API failed with status ${res.status}`);
        }
        const resBody = (await res.json()) as {
          blockslistMath: string[];
          categoriesAnalysis: { category: string; severity: number }[];
        };
        const harmfulContentDetected = resBody.categoriesAnalysis?.some(
          ({ severity }) => severity > maxAllowedSeverity,
        );
        const r = { harmfulContentDetected, ...resBody };
        await this.cache.set({ route, body, options }, r);
        return r;
      };

      const inputs = arrayify(await content);
      for (const input of inputs) {
        const text = typeof input === "string" ? input : input.content;
        const filename = typeof input === "string" ? undefined : input.filename;
        for (const chunk of chunkString(text, AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH)) {
          const res = await analyze(chunk);
          if (res.harmfulContentDetected)
            return {
              ...res,
              filename,
              chunk,
            };
        }
      }

      trace?.item("no harmful content detected");
      dbg(`no harmful content detected`);
      return { harmfulContentDetected: false };
    } finally {
      trace?.endDetails();
    }
  }

  async detectPromptInjection(
    content: Awaitable<ElementOrArray<string> | ElementOrArray<WorkspaceFile>>,
  ): Promise<{ attackDetected: boolean; filename?: string; chunk?: string }> {
    const options = {};
    const { trace } = this.options || {};
    const route = "text:shieldPrompt";

    try {
      dbg(`detecting prompt injection`);
      trace?.startDetails("🛡️ content safety: detecting prompt injection");

      const input = arrayify(await content);
      const userPrompts = input.filter((i) => typeof i === "string");
      const documents = input.filter((i) => typeof i === "object");

      const fetcher = await this.createClient(route);
      const shieldPrompt = async (body: AzureContentSafetyRequest) => {
        trace?.fence(YAMLStringify(body), "yaml");
        const cached = await this.cache.get({ route, body, options });
        if (cached) {
          trace?.itemValue("cached", YAMLStringify(cached));
          return cached as { attackDetected: boolean };
        }
        const res = await fetcher(body);
        if (!res.ok) {
          dbg(statusToMessage(res));
          throw new Error(`Azure Content Safety API failed with status ${res.status}`);
        }
        const resBody = (await res.json()) as AzureContentSafetyResponse;
        const attackDetected =
          !!resBody.userPromptAnalysis?.attackDetected ||
          resBody.documentsAnalysis?.some((doc) => doc.attackDetected);
        const r = { attackDetected };
        await this.cache.set({ route, body, options: {} }, r);
        return r;
      };

      for (const userPrompt of userPrompts) {
        for (const chunk of chunkString(
          userPrompt,
          AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH,
        )) {
          const res = await shieldPrompt({
            userPrompt: chunk,
            documents: [],
          });
          if (res.attackDetected)
            return {
              ...res,
              chunk,
            };
        }
      }
      for (const document of documents) {
        for (const chunk of chunkString(
          document.content,
          AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH,
        )) {
          const res = await shieldPrompt({
            userPrompt: "",
            documents: [chunk],
          });
          if (res.attackDetected)
            return {
              ...res,
              filename: document.filename,
              chunk,
            };
        }
      }
      trace.item("no attack detected");
      dbg(`no attack detected`);
      return { attackDetected: false };
    } finally {
      trace?.endDetails();
    }
  }

  private async createClient(route: string, options?: CancellationOptions) {
    const { trace } = this.options || {};
    const endpoint = trimTrailingSlash(
      process.env.AZURE_CONTENT_SAFETY_ENDPOINT || process.env.AZURE_CONTENT_SAFETY_API_ENDPOINT,
    );
    const credentialsType = ((
      process.env.AZURE_CONTENT_SAFETY_CREDENTIALS_TYPE ||
      process.env.AZURE_CONTENT_SAFETY_API_CREDENTIALS_TYPE
    )
      ?.toLowerCase()
      ?.trim() || "default") as AzureCredentialsType;
    let apiKey = process.env.AZURE_CONTENT_SAFETY_KEY || process.env.AZURE_CONTENT_SAFETY_API_KEY;
    let apiToken: string;
    if (!apiKey) {
      dbg(`requesting Azure token`);
      const { token, error } = await runtimeHost.azureToken.token(credentialsType, options);
      apiToken = token.token;
    }
    const version = process.env.AZURE_CONTENT_SAFETY_VERSION || "2024-09-01";
    dbg(`azure version: %s`, version);

    if (!endpoint)
      throw new Error(
        `AZURE_CONTENT_SAFETY_ENDPOINT is not set. See ${DOCS_CONFIGURATION_CONTENT_SAFETY_URL} for help.`,
      );
    if (!apiKey && !apiToken)
      throw new Error(
        `AZURE_CONTENT_SAFETY_KEY is not set or not signed in with Azure. See ${DOCS_CONFIGURATION_CONTENT_SAFETY_URL} for help.`,
      );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "genaiscript",
    };
    if (apiKey) headers["Ocp-Apim-Subscription-Key"] = apiKey;
    if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;

    const fetch = await createFetch(this.options);
    const url = `${endpoint}/contentsafety/${route}?api-version=${version}`;
    const fetcher = async (body: any) => {
      traceFetchPost(trace, url, headers, body);
      return await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    };
    return fetcher;
  }
}

/**
 * Determines if the Azure Content Safety client is configured by checking for the presence of a valid endpoint.
 *
 * @returns {boolean} - Returns true if the Azure Content Safety API endpoint is configured, false otherwise.
 *
 * Environment Variables:
 * - AZURE_CONTENT_SAFETY_ENDPOINT: The base endpoint for the Azure Content Safety API, if provided.
 * - AZURE_CONTENT_SAFETY_API_ENDPOINT: Alternative variable for the base endpoint, if the primary variable is not set.
 *
 * The function trims trailing slashes from the endpoint before validation.
 */
export function isAzureContentSafetyClientConfigured() {
  const endpoint = trimTrailingSlash(
    process.env.AZURE_CONTENT_SAFETY_ENDPOINT || process.env.AZURE_CONTENT_SAFETY_API_ENDPOINT,
  );
  return !!endpoint;
}

/**
 * Creates an Azure Content Safety client to detect harmful content and prompt injection in text or documents.
 *
 * @param options - Configuration options for the client.
 * - Includes properties for tracing operations, cancellation signals, and additional configurations.
 * - `signal` - Optional AbortSignal for request cancellation.
 *
 * @returns An object implementing ContentSafety, with methods:
 * - `detectHarmfulContent`: Analyzes text or documents for harmful content.
 * - `detectPromptInjection`: Analyzes text or documents for prompt injection attacks.
 */
export function createAzureContentSafetyClient(
  options: CancellationOptions & TraceOptions,
): ContentSafety {
  const client = new AzureContentSafetyClient(options);
  return {
    id: client.id,
    detectHarmfulContent: client.detectHarmfulContent.bind(client),
    detectPromptInjection: client.detectPromptInjection.bind(client),
  } satisfies ContentSafety;
}
