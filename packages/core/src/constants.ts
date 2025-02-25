import CONFIGURATION_DATA from "./llms.json"
export const CHANGE = "change"
export const TRACE_CHUNK = "traceChunk"
export const TRACE_DETAILS = "traceDetails"
export const RECONNECT = "reconnect"
export const OPEN = "open"
export const CLOSE = "close"
export const MESSAGE = "message"
export const ERROR = "error"
export const CONNECT = "connect"
export const LOG = "log"
export const QUEUE_SCRIPT_START = "queueScriptStart"
export const MAX_TOOL_CALLS = 10000

// https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
// https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cognitiveservices/data-plane/AzureOpenAI/inference/stable/2024-02-01/inference.yaml
// https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
export const AZURE_OPENAI_API_VERSION = "2025-01-01-preview"
export const AZURE_MANAGEMENT_API_VERSION = "2024-10-01"
export const AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES = Object.freeze([
    "https://cognitiveservices.azure.com/.default",
])
export const AZURE_AI_INFERENCE_VERSION = "2024-08-01-preview"
export const AZURE_AI_INFERENCE_TOKEN_SCOPES = Object.freeze([
    "https://ml.azure.com/.default",
])
export const AZURE_MANAGEMENT_TOKEN_SCOPES = Object.freeze([
    "https://management.azure.com/.default",
])
export const AZURE_TOKEN_EXPIRATION = 59 * 60_000 // 59 minutes

export const TOOL_URL = "https://microsoft.github.io/genaiscript"
export const TOOL_ID = "genaiscript"
export const GENAISCRIPT_FOLDER = "." + TOOL_ID
export const CLI_JS = TOOL_ID + ".cjs"
export const GENAI_SRC = "genaisrc"
export const GENAI_JS_EXT = ".genai.js"
export const GENAI_MJS_EXT = ".genai.mjs"
export const GENAI_MTS_EXT = ".genai.mts"
export const GENAI_MD_EXT = ".genai.md"
export const GENAI_ANYJS_GLOB =
    "**/*{.genai.js,.genai.mjs,.genai.ts,.genai.mts,.prompty}"
export const GENAI_ANY_REGEX = /\.(genai\.(ts|mts|mjs|js)|prompty)$/i
export const GENAI_ANYJS_REGEX = /\.genai\.js$/i
export const GENAI_ANYTS_REGEX = /\.genai\.(ts|mts|mjs)$/i
export const HTTPS_REGEX = /^https:\/\//i
export const CSV_REGEX = /\.(t|c)sv$/i
export const YAML_REGEX = /\.yaml$/i
export const INI_REGEX = /\.ini$/i
export const TOML_REGEX = /\.toml$/i
export const XLSX_REGEX = /\.xlsx$/i
export const XML_REGEX = /\.xml$/i
export const DOCX_REGEX = /\.docx$/i
export const PDF_REGEX = /\.pdf$/i
export const MD_REGEX = /\.md$/i
export const MDX_REGEX = /\.mdx$/i
export const MJS_REGEX = /\.mjs$/i
export const JS_REGEX = /\.js$/i
export const JSON5_REGEX = /\.json5?$/i
export const JSONL_REGEX = /\.jsonl$/i
export const PROMPTY_REGEX = /\.prompty$/i
export const TOOL_NAME = "GenAIScript"
export const SERVER_PORT = 8003
export const CLIENT_RECONNECT_DELAY = 3000
export const CLIENT_RECONNECT_MAX_ATTEMPTS = 20
export const RETRIEVAL_PERSIST_DIR = "retrieval"
export const HIGHLIGHT_LENGTH = 4000
export const SMALL_MODEL_ID = "small"
export const LARGE_MODEL_ID = "large"
export const VISION_MODEL_ID = "vision"
export const TRANSCRIPTION_MODEL_ID = "transcription"
export const SPEECH_MODEL_ID = "speech"
export const DEFAULT_FENCE_FORMAT: FenceFormat = "xml"
export const DEFAULT_TEMPERATURE = 0.8
export const CACHE_LLMREQUEST_PREFIX = "genaiscript/cache/llm/"
export const CACHE_AIREQUEST_TRACE_PREFIX = "genaiscript/cache/ai/trace/"
export const CACHE_AIREQUEST_TEXT_PREFIX = "genaiscript/cache/ai/text/"
export const TRACE_NODE_PREFIX = "genaiscript/trace/"
export const EXTENSION_ID = "genaiscript.genaiscript-vscode"
export const COPILOT_CHAT_PARTICIPANT_ID = TOOL_ID
export const COPILOT_CHAT_PARTICIPANT_SCRIPT_ID = "copilotchat"

export const BING_SEARCH_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search"
export const TAVILY_ENDPOINT = "https://api.tavily.com/search"

export const SYSTEM_FENCE = "\n"
export const MAX_DATA_REPAIRS = 1
export const NPM_CLI_PACKAGE = "genaiscript"
export const AICI_CONTROLLER = "gh:microsoft/aici/jsctrl"
export const ICON_LOGO_NAME = "genaiscript-logo"
export const SARIFF_RULEID_PREFIX = "genaiscript/"
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
export const OLLAMA_DEFAUT_PORT = 11434
export const OLLAMA_API_BASE = "http://127.0.0.1:11434/v1"
export const LLAMAFILE_API_BASE = "http://127.0.0.1:8080/v1"
export const LOCALAI_API_BASE = "http://127.0.0.1:8080/v1"
export const LITELLM_API_BASE = "http://127.0.0.1:4000"
export const LMSTUDIO_API_BASE = "http://127.0.0.1:1234/v1"
export const JAN_API_BASE = "http://127.0.0.1:1337/v1"
export const ANTHROPIC_API_BASE = "https://api.anthropic.com"
export const HUGGINGFACE_API_BASE = "https://api-inference.huggingface.co/v1"
export const GOOGLE_API_BASE =
    "https://generativelanguage.googleapis.com/v1beta/openai/"
export const ALIBABA_BASE =
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
export const MISTRAL_API_BASE = "https://api.mistral.ai/v1"
export const DEEPSEEK_API_BASE = "https://api.deepseek.com/v1"
export const WHISPERASR_API_BASE = "http://localhost:9000"

export const PROMPTFOO_CACHE_PATH = ".genaiscript/cache/tests"
export const PROMPTFOO_CONFIG_DIR = ".genaiscript/config/tests"
export const PROMPTFOO_REMOTE_API_PORT = 15500
export const PROMPTFOO_REDTEAM_NUM_TESTS = 5
export const PROMPTFOO_TEST_MAX_CONCURRENCY = 1

export const RUNS_DIR_NAME = "runs"
export const CONVERTS_DIR_NAME = "converts"
export const TEST_RUNS_DIR_NAME = "test-runs"
export const STATS_DIR_NAME = "stats"
export const TRACE_FILENAME = "trace.md"
export const OUTPUT_FILENAME = "output.md"

export const EMOJI_SUCCESS = "✅"
export const EMOJI_FAIL = "❌"
export const EMOJI_WARNING = "⚠️"
export const EMOJI_UNDEFINED = "?"

export const MODEL_PROVIDER_OPENAI = "openai"
export const MODEL_PROVIDER_GITHUB = "github"
export const MODEL_PROVIDER_AZURE_OPENAI = "azure"
export const MODEL_PROVIDER_GOOGLE = "google"
export const MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI = "azure_serverless"
export const MODEL_PROVIDER_AZURE_SERVERLESS_MODELS = "azure_serverless_models"
export const MODEL_PROVIDER_OLLAMA = "ollama"
export const MODEL_PROVIDER_LLAMAFILE = "llamafile"
export const MODEL_PROVIDER_LITELLM = "litellm"
export const MODEL_PROVIDER_AICI = "aici"
export const MODEL_PROVIDER_GITHUB_COPILOT_CHAT = "github_copilot_chat"
export const MODEL_PROVIDER_ANTHROPIC = "anthropic"
export const MODEL_PROVIDER_ANTHROPIC_BEDROCK = "anthropic_bedrock"
export const MODEL_PROVIDER_HUGGINGFACE = "huggingface"
export const MODEL_PROVIDER_TRANSFORMERS = "transformers"
export const MODEL_PROVIDER_ALIBABA = "alibaba"
export const MODEL_PROVIDER_MISTRAL = "mistral"
export const MODEL_PROVIDER_LMSTUDIO = "lmstudio"
export const MODEL_PROVIDER_JAN = "jan"
export const MODEL_PROVIDER_DEEPSEEK = "deepseek"
export const MODEL_PROVIDER_WHISPERASR = "whisperasr"
export const MODEL_PROVIDER_ECHO = "echo"
export const MODEL_PROVIDER_NONE = "none"

export const MODEL_PROVIDER_OPENAI_HOSTS = Object.freeze([
    MODEL_PROVIDER_OPENAI,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
])

export const TRACE_FILE_PREVIEW_MAX_LENGTH = 240

export const OPENROUTER_API_CHAT_URL =
    "https://openrouter.ai/api/v1/chat/completions"
export const OPENROUTER_SITE_URL_HEADER = "HTTP-Referer"
export const OPENROUTER_SITE_NAME_HEADER = "X-Title"

export const GITHUB_MODELS_BASE = "https://models.inference.ai.azure.com"

export const DOCS_CONFIGURATION_URL =
    "https://microsoft.github.io/genaiscript/getting-started/configuration/"
export const DOCS_CONFIGURATION_CONTENT_SAFETY_URL =
    "https://microsoft.github.io/genaiscript/reference/scripts/content-safety"
export const DOCS_DEF_FILES_IS_EMPTY_URL =
    "https://microsoft.github.io/genaiscript/reference/scripts/context/#empty-files"
export const DOCS_WEB_SEARCH_URL =
    "https://microsoft.github.io/genaiscript/reference/scripts/web-search/"
export const DOCS_WEB_SEARCH_BING_SEARCH_URL =
    "https://microsoft.github.io/genaiscript/reference/scripts/web-search/#bingn"
export const DOCS_WEB_SEARCH_TAVILY_URL =
    "https://microsoft.github.io/genaiscript/reference/scripts/web-search/#tavily"

export const MODEL_PROVIDERS = Object.freeze<
    {
        id: string
        detail: string
        url?: string
        seed?: boolean
        logitBias?: boolean
        tools?: boolean
        logprobs?: boolean
        topLogprobs?: boolean
        topP?: boolean
        prediction?: boolean
        bearerToken?: boolean
        listModels?: boolean
        transcribe?: boolean
        speech?: boolean
        tokenless?: boolean
        hidden?: boolean
        aliases?: Record<string, string>
        env?: Record<
            string,
            {
                description?: string
                secret?: boolean
                required?: boolean
                format?: string
                enum?: string[]
            }
        >
    }[]
>(CONFIGURATION_DATA.providers)
export const MODEL_PRICINGS = Object.freeze<
    Record<
        string,
        {
            price_per_million_input_tokens: number
            price_per_million_output_tokens: number
            input_cache_token_rebate?: number
        }
    >
>(CONFIGURATION_DATA.pricings)

export const NEW_SCRIPT_TEMPLATE = `$\`Write a short poem in code.\`
`
export const PDF_SCALE = 4
export const PDF_HASH_LENGTH = 12

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
export const DOCKER_CONTAINER_VOLUME = "app"

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

export const CONSOLE_COLOR_INFO = 32
export const CONSOLE_COLOR_DEBUG = 90
export const CONSOLE_COLOR_REASONING = 90
export const CONSOLE_COLOR_WARNING = 95
export const CONSOLE_COLOR_ERROR = 91
export const CONSOLE_TOKEN_COLORS = [90, 37]
//export const CONSOLE_TOKEN_COLORS = [97, 93]
export const CONSOLE_TOKEN_INNER_COLORS = [90, 37]

export const PLAYWRIGHT_DEFAULT_BROWSER = "chromium"
export const MAX_TOKENS_ELLIPSE = "..."
export const ESTIMATE_TOKEN_OVERHEAD = 2

export const DEDENT_INSPECT_MAX_DEPTH = 3

export const OPENAI_MAX_RETRY_DELAY = 10000
export const OPENAI_MAX_RETRY_COUNT = 10
export const OPENAI_RETRY_DEFAULT_DEFAULT = 1000

export const ANTHROPIC_MAX_TOKEN = 4096

export const TEMPLATE_ARG_FILE_MAX_TOKENS = 4000
export const TEMPLATE_ARG_DATA_SLICE_SAMPLE = 2000

export const CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT = 8
export const PROMISE_QUEUE_CONCURRENCY_DEFAULT = 16

export const GITHUB_REST_API_CONCURRENCY_LIMIT = 8
export const GITHUB_REST_PAGE_DEFAULT = 10

export const TOKEN_TRUNCATION_THRESHOLD = 16

export const GIT_IGNORE_GENAI = ".gitignore.genai"
export const CLI_ENV_VAR_RX = /^genaiscript_var_/i

export const GIT_DIFF_MAX_TOKENS = 8000
export const GIT_LOG_COUNT = 10
export const MAX_TOOL_CONTENT_TOKENS = 4000

export const AGENT_MEMORY_CACHE_NAME = "agent_memory"
export const AGENT_MEMORY_FLEX_TOKENS = 20000
export const TRANSCRIPTION_CACHE_NAME = "transcriptions"

export const AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH = 9000
export const AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_DOCUMENTS = 9000

export const TOKEN_MISSING_INFO = "<MISSING_INFO>"
export const TOKEN_NO_ANSWER = "<NO_ANSWER>"

export const CHOICE_LOGIT_BIAS = 5

export const SANITIZED_PROMPT_INJECTION =
    "...prompt injection detected, content removed..."

// https://platform.openai.com/docs/guides/vision/calculating-costs#managing-images
export const IMAGE_DETAIL_LOW_WIDTH = 512
export const IMAGE_DETAIL_LOW_HEIGHT = 512
export const IMAGE_DETAIL_HIGH_TILE_SIZE = 512
export const IMAGE_DETAIL_HIGH_WIDTH = 2048
export const IMAGE_DETAIL_HIGH_HEIGHT = 2048
export const IMAGE_DETAIL_LONG_SIDE_LIMIT = 2000
export const IMAGE_DETAIL_SHORT_SIDE_LIMIT = 768

export const MIN_LINE_NUMBER_LENGTH = 10

export const VSCODE_SERVER_MAX_RETRIES = 5

export const VIDEO_HASH_LENGTH = 12
export const VIDEO_FRAMES_DIR_NAME = "frames"
export const VIDEO_CLIPS_DIR_NAME = "clips"
export const VIDEO_AUDIO_DIR_NAME = "audio"
export const VIDEO_PROBE_DIR_NAME = "probe"

export const TRACE_MAX_FILE_SIZE = 128 * 1024 // 100kb
export const TRACE_MAX_IMAGE_SIZE = 64 * 1024 // 10kb

export const WS_MAX_FRAME_LENGTH = 1200000
export const WS_MAX_FRAME_CHUNK_LENGTH = 1000000

export const SCHEMA_DEFAULT_FORMAT = "json"
export const THINK_REGEX = /<think>(.*?)($|<\/think>)/gis

export const MAX_FILE_CONTENT_SIZE = 1024 * 1024 * 2 // 2MB
export const TEST_CSV_ENTRY_SEPARATOR = /[;|\n]/g

export const INVALID_FILENAME_REGEX = /[<>:"/\\|?*\x00-\x1F]+/g

export const ANTHROPIC_REASONING_EFFORTS: Record<string, number> = {
    low: 2048,
    medium: 4096,
    high: 16384,
}
