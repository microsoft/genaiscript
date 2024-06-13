export const CHANGE = "change"
export const MAX_CACHED_TEMPERATURE = 0.5
export const MAX_CACHED_TOP_P = 0.5
export const MAX_TOOL_CALLS = 100
// https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
// https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cognitiveservices/data-plane/AzureOpenAI/inference/stable/2024-02-01/inference.yaml
export const AZURE_OPENAI_API_VERSION = "2024-02-01"
export const AZURE_OPENAI_TOKEN_SCOPES = Object.freeze([
    "https://cognitiveservices.azure.com/.default",
    // "offline_access",
])
export const TOOL_ID = "genaiscript"
export const GENAISCRIPT_FOLDER = "." + TOOL_ID
export const CLI_JS = TOOL_ID + ".cjs"
export const GENAI_SRC = "genaisrc"
export const GENAI_JS_EXT = ".genai.js"
export const GENAI_MJS_EXT = ".genai.mjs"
export const GENAI_JS_GLOB = "**/*.genai.*js"
export const GENAI_JS_REGEX = /\.genai\.m?js$/i
export const GPSPEC_REGEX = /\.gpspec\.md$/i
export const HTTPS_REGEX = /^https:\/\//i
export const CSV_REGEX = /\.(t|c)sv$/i
export const XLSX_REGEX = /\.xlsx$/i
export const DOCX_REGEX = /\.docx$/i
export const PDF_REGEX = /\.pdf$/i
export const MDX_REGEX = /\.mdx$/i
export const GPSPEC_GLOB = "**/*.gpspec.md"
export const TOOL_NAME = "GenAIScript"
export const SERVER_PORT = 8003
export const CLIENT_RECONNECT_DELAY = 2000
export const RETRIEVAL_PERSIST_DIR = "retrieval"
export const HIGHLIGHT_LENGTH = 4000
export const DEFAULT_MODEL = "gpt-4"
export const DEFAULT_TEMPERATURE = 0.2 // 0.0-2.0, defaults to 1.0
export const BUILTIN_PREFIX = "_builtin/"
export const CACHE_LLMREQUEST_PREFIX = "cache.llm.request/"
export const CACHE_AIREQUEST_PREFIX = "cache.ai.request/"
export const TOKENS_STATUS_BAR_DEBOUNCE_TIME = 800
export const EXTENSION_ID = "genaiscript.genaiscript-vscode"
export const CHAT_PARTICIPANT_ID = TOOL_ID
export const BING_SEARCH_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search"
export const LLAMAINDEX_SIMILARITY_TOPK = 5
export const LLAMAINDEX_MIN_SCORE = 0.1
export const RETRIEVAL_DEFAULT_INDEX = "default"
export const RETRIEVAL_DEFAULT_LLM_MODEL = "gpt-35-turbo"
export const RETRIEVAL_DEFAULT_EMBED_MODEL = "text-embedding-ada-002"
export const RETRIEVAL_DEFAULT_TEMPERATURE = 0
export const SYSTEM_FENCE = "\n"
export const MAX_DATA_REPAIRS = 1
export const NPM_CLI_PACKAGE = "genaiscript"
export const AICI_CONTROLLER = "gh:microsoft/aici/jsctrl"
export const ICON_LOGO_NAME = "genaiscript-logo"
export const SARIFF_RULEID_PREFIX = "genascript/"
export const SARIFF_BUILDER_URL = "https://github.com/microsoft/genaiscript/"
export const SARIFF_BUILDER_TOOL_DRIVER_NAME = TOOL_ID
export const FETCH_RETRY_DEFAULT = 5
export const FETCH_RETRY_DEFAULT_DEFAULT = 2000
export const FETCH_RETRY_MAX_DELAY_DEFAULT = 120000
export const EXEC_MAX_BUFFER = 64

export const UNHANDLED_ERROR_CODE = -1
export const ANNOTATION_ERROR_CODE = -2
export const FILES_NOT_FOUND_ERROR_CODE = -3
export const GENERATION_ERROR_CODE = -4
export const RUNTIME_ERROR_CODE = -5
export const CONNECTION_CONFIGURATION_ERROR_CODE = -6
export const USER_CANCELLED_ERROR_CODE = -7
export const CONFIGURATION_ERROR_CODE = -8

export const DOT_ENV_REGEX = /\.env$/i
export const PROMPT_FENCE = "```"
export const MARKDOWN_PROMPT_FENCE = "`````"

export const OPENAI_API_BASE = "https://api.openai.com/v1"
export const OLLAMA_API_BASE = "http://localhost:11434/v1"
export const LLAMAFILE_API_BASE = "http://localhost:8080/v1"
export const LOCALAI_API_BASE = "http://localhost:8080/v1"
export const LITELLM_API_BASE = "http://localhost:4000"

export const PROMPTFOO_CACHE_PATH = ".genaiscript/cache/tests"
export const PROMPTFOO_CONFIG_DIR = ".genaiscript/config/tests"
export const PROMPTFOO_REMOTE_API_PORT = 15500

export const EMOJI_SUCCESS = "✅"
export const EMOJI_FAIL = "❌"
export const EMOJI_UNDEFINED = "?"

export const MODEL_PROVIDER_OPENAI = "openai"
export const MODEL_PROVIDER_AZURE = "azure"
export const MODEL_PROVIDER_OLLAMA = "ollama"
export const MODEL_PROVIDER_LLAMAFILE = "llamafile"
export const MODEL_PROVIDER_LITELLM = "litellm"
export const MODEL_PROVIDER_AICI = "aici"

export const TRACE_FILE_PREVIEW_MAX_LENGTH = 240

export const DOCS_CONFIGURATION_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/"
export const DOCS_CONFIGURATION_OPENAI_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#openai"
export const DOCS_CONFIGURATION_AZURE_OPENAI_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#azure-openai"
export const DOCS_CONFIGURATION_OLLAMA_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#ollama"
export const DOCS_CONFIGURATION_LLAMAFILE_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#llamafile"
export const DOCS_CONFIGURATION_LITELLM_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#litellm"
export const DOCS_CONFIGURATION_LOCALAI_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#localai"
export const DOCS_CONFIGURATION_AICI_URL =
    "https://microsoft.github.io/genaiscript/reference/scripts/aici/"

export const MODEL_PROVIDERS = Object.freeze([
    {
        id: MODEL_PROVIDER_OPENAI,
        detail: "OpenAI or compatible",
        url: DOCS_CONFIGURATION_OPENAI_URL,
    },
    {
        id: MODEL_PROVIDER_AZURE,
        detail: "Azure OpenAI deployment",
        url: DOCS_CONFIGURATION_AZURE_OPENAI_URL,
    },
    {
        id: MODEL_PROVIDER_OLLAMA,
        detail: "Ollama local model",
        url: DOCS_CONFIGURATION_OLLAMA_URL,
    },
    {
        id: MODEL_PROVIDER_LLAMAFILE,
        detail: "llamafile.ai local model",
        url: DOCS_CONFIGURATION_LLAMAFILE_URL,
    },
    {
        id: MODEL_PROVIDER_LITELLM,
        detail: "LiteLLM proxy",
        url: DOCS_CONFIGURATION_LITELLM_URL,
    },
    {
        id: MODEL_PROVIDER_AICI,
        detail: "AICI controller",
        url: DOCS_CONFIGURATION_AICI_URL,
    },
])

export const NEW_SCRIPT_TEMPLATE = `// use def to emit LLM variables 
// https://microsoft.github.io/genaiscript/reference/scripts/context/#definition-def
def("FILE", env.files)

// use $ to output formatted text to the prompt
// https://microsoft.github.io/genaiscript/reference/scripts/prompt/
$\`TELL THE LLM WHAT TO DO...\`

// next, "Run GenAIScript"
// https://microsoft.github.io/genaiscript/getting-started/running-scripts/
`

export const PDF_MIME_TYPE = "application/pdf"
export const DOCX_MIME_TYPE =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
export const XLSX_MIME_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
export const JSON_MIME_TYPE = "application/json"
export const JSON_SCHEMA_MIME_TYPE = "application/schema+json"
export const JAVASCRIPT_MIME_TYPE = "application/javascript"
export const MARKDOWN_MIME_TYPE = "text/markdown"
export const YAML_MIME_TYPE = "application/yaml"

export const JSON_META_SCHEMA_URI =
    "https://json-schema.org/draft/2020-12/schema"

export const SHELL_EXEC_TIMEOUT = 300000
export const DOCKER_DEFAULT_IMAGE = "python:alpine"
export const DOCKER_VOLUMES_DIR = "containers"
export const DOCKER_CONTAINER_VOLUME = "/app"

export const CLI_RUN_FILES_FOLDER = "files"

export const GITHUB_API_VERSION = "2022-11-28"
export const GITHUB_TOKEN = "GITHUB_TOKEN"

export const AI_REQUESTS_CACHE = "airequests"
export const CHAT_CACHE = "chatv2"
export const GITHUB_PULL_REQUEST_REVIEWS_CACHE = "prr"
