export const CHANGE = "change"
export const TRACE_CHUNK = "traceChunk"
export const TRACE_DETAILS = "traceDetails"
export const RECONNECT = "reconnect"
export const OPEN = "open"
export const MAX_TOOL_CALLS = 10000

// https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
// https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cognitiveservices/data-plane/AzureOpenAI/inference/stable/2024-02-01/inference.yaml
// https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
export const AZURE_OPENAI_API_VERSION = "2024-06-01"
export const AZURE_OPENAI_TOKEN_SCOPES = Object.freeze([
    "https://cognitiveservices.azure.com/.default",
    "offline_access",
])
export const AZURE_OPENAI_TOKEN_EXPIRATION = 59 * 60_000 // 59 minutes

export const TOOL_ID = "genaiscript"
export const GENAISCRIPT_FOLDER = "." + TOOL_ID
export const CLI_JS = TOOL_ID + ".cjs"
export const GENAI_SRC = "genaisrc"
export const GENAI_JS_EXT = ".genai.js"
export const GENAI_MJS_EXT = ".genai.mjs"
export const GENAI_ANYJS_GLOB =
    "**/*{.genai.js,.genai.mjs,.genai.ts,.genai.mts,.prompty}"
export const GENAI_ANY_REGEX = /\.(genai\.(ts|mts|mjs|js)|prompty)$/i
export const GENAI_ANYJS_REGEX = /\.genai\.js$/i
export const GENAI_ANYTS_REGEX = /\.genai\.(ts|mts|mjs)$/i
export const HTTPS_REGEX = /^https:\/\//i
export const CSV_REGEX = /\.(t|c)sv$/i
export const XLSX_REGEX = /\.xlsx$/i
export const DOCX_REGEX = /\.docx$/i
export const PDF_REGEX = /\.pdf$/i
export const MDX_REGEX = /\.mdx$/i
export const MJS_REGEX = /\.mjs$/i
export const JS_REGEX = /\.js$/i
export const PROMPTY_REGEX = /\.prompty$/i
export const TOOL_NAME = "GenAIScript"
export const SERVER_PORT = 8003
export const CLIENT_RECONNECT_DELAY = 3000
export const CLIENT_RECONNECT_MAX_ATTEMPTS = 20
export const RETRIEVAL_PERSIST_DIR = "retrieval"
export const HIGHLIGHT_LENGTH = 4000
export const SMALL_MODEL_ID = "small"
export const LARGE_MODEL_ID = "large"
export const DEFAULT_MODEL = "openai:gpt-4o"
export const DEFAULT_MODEL_CANDIDATES = [
    "azure:gpt-4o",
    DEFAULT_MODEL,
    "github:gpt-4o",
    "client:gpt-4",
]
export const DEFAULT_SMALL_MODEL = "openai:gpt-4o-mini"
export const DEFAULT_SMALL_MODEL_CANDIDATES = [
    "azure:gpt-4o-mini",
    DEFAULT_SMALL_MODEL,
    "github:gpt-4o-mini",
    "client:gpt-4-mini",
]
export const DEFAULT_EMBEDDINGS_MODEL_CANDIDATES = [
    "azure:text-embedding-3-small",
    "azure:text-embedding-2-small",
    "openai:text-embedding-3-small",
    "github:text-embedding-3-small",
    "client:text-embedding-3-small",
]
export const DEFAULT_EMBEDDINGS_MODEL = "openai:text-embedding-ada-002"
export const DEFAULT_TEMPERATURE = 0.8
export const BUILTIN_PREFIX = "_builtin/"
export const CACHE_LLMREQUEST_PREFIX = "genaiscript/cache/llm/"
export const CACHE_AIREQUEST_PREFIX = "genaiscript/cache/ai/"
export const TRACE_NODE_PREFIX = "genaiscript/trace/"
export const EXTENSION_ID = "genaiscript.genaiscript-vscode"
export const CHAT_PARTICIPANT_ID = TOOL_ID
export const BING_SEARCH_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search"
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
export const FETCH_RETRY_GROWTH_FACTOR = 1.5
export const EXEC_MAX_BUFFER = 64
export const DOT_ENV_FILENAME = ".env"

export const SUCCESS_ERROR_CODE = 0
export const UNHANDLED_ERROR_CODE = -1
export const ANNOTATION_ERROR_CODE = -2
export const FILES_NOT_FOUND_ERROR_CODE = -3
export const GENERATION_ERROR_CODE = -4
export const RUNTIME_ERROR_CODE = -5
export const CONNECTION_CONFIGURATION_ERROR_CODE = -6
export const USER_CANCELLED_ERROR_CODE = -7
export const CONFIGURATION_ERROR_CODE = -8

export const UNRECOVERABLE_ERROR_CODES = Object.freeze([
    CONNECTION_CONFIGURATION_ERROR_CODE,
    USER_CANCELLED_ERROR_CODE,
    FILES_NOT_FOUND_ERROR_CODE,
    ANNOTATION_ERROR_CODE,
])

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

export const RUNS_DIR_NAME = "runs"

export const EMOJI_SUCCESS = "✅"
export const EMOJI_FAIL = "❌"
export const EMOJI_UNDEFINED = "?"

export const MODEL_PROVIDER_OPENAI = "openai"
export const MODEL_PROVIDER_GITHUB = "github"
export const MODEL_PROVIDER_AZURE = "azure"
export const MODEL_PROVIDER_OLLAMA = "ollama"
export const MODEL_PROVIDER_LLAMAFILE = "llamafile"
export const MODEL_PROVIDER_LITELLM = "litellm"
export const MODEL_PROVIDER_AICI = "aici"
export const MODEL_PROVIDER_CLIENT = "client"

export const TRACE_FILE_PREVIEW_MAX_LENGTH = 240

export const GITHUB_MODELS_BASE = "https://models.inference.ai.azure.com"

export const DOCS_CONFIGURATION_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/"
export const DOCS_CONFIGURATION_OPENAI_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#openai"
export const DOCS_CONFIGURATION_GITHUB_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#github"
export const DOCS_CONFIGURATION_AZURE_OPENAI_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/#azure"
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
        id: MODEL_PROVIDER_GITHUB,
        detail: "GitHub Models",
        url: DOCS_CONFIGURATION_GITHUB_URL,
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

export const NEW_SCRIPT_TEMPLATE = `$\`Write a short poem in code.\`
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
export const CHAT_CACHE = "chat"
export const GITHUB_PULL_REQUEST_REVIEWS_CACHE = "prr"
export const GITHUB_PULL_REQUEST_REVIEW_COMMENT_LINE_DISTANCE = 5

export const PLACEHOLDER_API_BASE = "<custom api base>"
export const PLACEHOLDER_API_KEY = "<your token>"

export const VSCODE_CONFIG_CLI_VERSION = "cli.version"
export const VSCODE_CONFIG_CLI_PATH = "cli.path"

export const CONSOLE_COLOR_INFO = 97
export const CONSOLE_COLOR_DEBUG = 34
export const CONSOLE_COLOR_WARNING = 95
export const CONSOLE_COLOR_ERROR = 91

export const PLAYWRIGHT_DEFAULT_BROWSER = "chromium"
export const MAX_TOKENS_ELLIPSE = "..."
export const ESTIMATE_TOKEN_OVERHEAD = 2

export const DEDENT_INSPECT_MAX_DEPTH = 3

export const OPENAI_MAX_RETRY_DELAY = 10000
export const OPENAI_MAX_RETRY_COUNT = 10
export const OPENAI_RETRY_DEFAULT_DEFAULT = 1000

export const TEMPLATE_ARG_FILE_MAX_TOKENS = 4000
export const TEMPLATE_ARG_DATA_SLICE_SAMPLE = 2000

export const CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT = 8
export const PROMISE_QUEUE_CONCURRENCY_DEFAULT = 16

export const GITHUB_REST_API_CONCURRENCY_LIMIT = 8
export const GITHUB_REST_PAGE_DEFAULT = 50

export const TOKEN_TRUNCATION_THRESHOLD = 128

export const GIT_IGNORE_GENAI = ".gitignore.genai"
export const CLI_ENV_VAR_RX = /^genaiscript_var_/i

export const GIT_DIFF_MAX_TOKENS = 8000
export const MAX_TOOL_CONTENT_TOKENS = 4000

export const AGENT_MEMORY_CACHE_NAME = "agent_memory"
