"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJS_REGEX = exports.MDX_REGEX = exports.MD_REGEX = exports.PDF_REGEX = exports.DOCX_REGEX = exports.XML_REGEX = exports.XLSX_REGEX = exports.TOML_REGEX = exports.INI_REGEX = exports.YAML_REGEX = exports.CSV_REGEX = exports.HTTPS_REGEX = exports.HTTP_OR_S_REGEX = exports.GENAI_MD_REGEX = exports.GENAI_ANYTS_REGEX = exports.GENAI_ANYJS_REGEX = exports.GENAI_ANY_REGEX = exports.NEGATIVE_GLOB_REGEX = exports.GENAI_ANYJS_GLOB = exports.GENAI_MD_EXT = exports.GENAI_MTS_EXT = exports.GENAI_MJS_EXT = exports.GENAI_JS_EXT = exports.GENAI_SRC = exports.GENAISCRIPT_FOLDER = exports.TOOL_ID = exports.TOOL_URL = exports.DOCS_URL = exports.AZURE_TOKEN_EXPIRATION = exports.AZURE_MANAGEMENT_TOKEN_SCOPES = exports.AZURE_AI_INFERENCE_TOKEN_SCOPES = exports.AZURE_AI_INFERENCE_VERSION = exports.AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES = exports.AZURE_MANAGEMENT_API_VERSION = exports.AZURE_OPENAI_API_VERSION = exports.MAX_TOOL_DESCRIPTION_LENGTH = exports.MAX_TOOL_CALLS = exports.QUEUE_SCRIPT_START = exports.LOG = exports.CONNECT = exports.ERROR = exports.MESSAGE = exports.READY = exports.CLOSE = exports.OPEN = exports.RECONNECT = exports.TRACE_DETAILS = exports.TRACE_CHUNK = exports.RESOURCE_CHANGE = exports.CHANGE = void 0;
exports.UNHANDLED_ERROR_CODE = exports.SUCCESS_ERROR_CODE = exports.DOT_ENV_GENAISCRIPT_FILENAME = exports.DOT_ENV_FILENAME = exports.EXEC_MAX_BUFFER = exports.FETCH_RETRY_ON_DEFAULT = exports.FETCH_RETRY_GROWTH_FACTOR = exports.FETCH_RETRY_MAX_RETRY_AFTER_DEFAULT = exports.FETCH_RETRY_MAX_DELAY_DEFAULT = exports.FETCH_RETRY_MIN_DELAY_DEFAULT = exports.FETCH_RETRY_DELAY_DEFAULT = exports.FETCH_RETRY_DEFAULT = exports.OPENAI_MAX_RETRY_AFTER_DEFAULT = exports.OPENAI_RETRY_DEFAULT_DEFAULT = exports.OPENAI_MAX_RETRY_COUNT = exports.OPENAI_MAX_RETRY_DELAY = exports.SARIFF_BUILDER_TOOL_DRIVER_NAME = exports.SARIFF_BUILDER_URL = exports.SARIFF_RULEID_PREFIX = exports.ICON_LOGO_NAME = exports.NPM_CLI_PACKAGE = exports.MAX_DATA_REPAIRS = exports.SYSTEM_FENCE = exports.TAVILY_ENDPOINT = exports.COPILOT_CHAT_PARTICIPANT_SCRIPT_ID = exports.COPILOT_CHAT_PARTICIPANT_ID = exports.EXTENSION_ID = exports.TRACE_NODE_PREFIX = exports.DEFAULT_TEMPERATURE = exports.DEFAULT_FENCE_FORMAT = exports.EMBEDDINGS_MODEL_ID = exports.IMAGE_GENERATION_MODEL_ID = exports.SPEECH_MODEL_ID = exports.TRANSCRIPTION_MODEL_ID = exports.VISION_MODEL_ID = exports.LARGE_MODEL_ID = exports.SMALL_MODEL_ID = exports.HIGHLIGHT_LENGTH = exports.RETRIEVAL_PERSIST_DIR = exports.CLIENT_RECONNECT_MAX_ATTEMPTS = exports.CLIENT_RECONNECT_DELAY = exports.OPENAPI_SERVER_PORT = exports.SERVER_PORT = exports.TOOL_NAME = exports.PROMPTY_REGEX = exports.JSONL_REGEX = exports.JSON5_REGEX = exports.TS_IMPORT_REGEX = exports.JS_REGEX = exports.MJTS_REGEX = void 0;
exports.MODEL_PROVIDER_AZURE_OPENAI = exports.MODEL_PROVIDER_GITHUB = exports.MODEL_PROVIDER_OPENAI = exports.EMOJI_UNDEFINED = exports.EMOJI_WARNING = exports.EMOJI_FAIL = exports.EMOJI_SUCCESS = exports.OUTPUT_FILENAME = exports.TRACE_FILENAME = exports.STATS_DIR_NAME = exports.TEST_RUNS_DIR_NAME = exports.CONVERTS_DIR_NAME = exports.RUNS_DIR_NAME = exports.TYPE_DEFINITION_REFERENCE = exports.TYPE_DEFINITION_BASENAME = exports.PROMPTFOO_TEST_MAX_CONCURRENCY = exports.PROMPTFOO_REDTEAM_NUM_TESTS = exports.PROMPTFOO_REMOTE_API_PORT = exports.PROMPTFOO_CONFIG_DIR = exports.PROMPTFOO_CACHE_PATH = exports.DOCKER_MODEL_RUNNER_API_BASE = exports.WINDOWS_AI_API_BASE = exports.WHISPERASR_API_BASE = exports.DEEPSEEK_API_BASE = exports.MISTRAL_API_BASE = exports.ALIBABA_BASE = exports.GOOGLE_API_BASE = exports.HUGGINGFACE_API_BASE = exports.ANTHROPIC_API_BASE = exports.JAN_API_BASE = exports.LMSTUDIO_API_BASE = exports.LITELLM_API_BASE = exports.LOCALAI_API_BASE = exports.LLAMAFILE_API_BASE = exports.VLLM_API_BASE = exports.SGLANG_API_BASE = exports.OLLAMA_API_BASE = exports.OLLAMA_DEFAULT_PORT = exports.OPENAI_API_BASE = exports.MARKDOWN_PROMPT_FENCE = exports.PROMPT_FENCE = exports.DOT_ENV_REGEX = exports.UNRECOVERABLE_ERROR_CODES = exports.CONFIGURATION_ERROR_CODE = exports.USER_CANCELLED_ERROR_CODE = exports.CONNECTION_CONFIGURATION_ERROR_CODE = exports.RUNTIME_ERROR_CODE = exports.GENERATION_ERROR_CODE = exports.FILES_NOT_FOUND_ERROR_CODE = exports.ANNOTATION_ERROR_CODE = void 0;
exports.JSON_MIME_TYPE = exports.XLSX_MIME_TYPE = exports.DOCX_MIME_TYPE = exports.PDF_MIME_TYPE = exports.FILE_HASH_LENGTH = exports.RESOURCE_HASH_LENGTH = exports.VECTOR_INDEX_HASH_LENGTH = exports.DOCX_HASH_LENGTH = exports.PDF_HASH_LENGTH = exports.PDF_SCALE = exports.NEW_SCRIPT_TEMPLATE = exports.MODEL_PRICINGS = exports.MODEL_PROVIDERS = exports.DOCS_WEB_SEARCH_TAVILY_URL = exports.DOCS_WEB_SEARCH_BING_SEARCH_URL = exports.DOCS_WEB_SEARCH_URL = exports.DOCS_DEF_FILES_IS_EMPTY_URL = exports.DOCS_CONFIGURATION_CONTENT_SAFETY_URL = exports.DOCS_CONFIGURATION_URL = exports.GITHUB_MODELS_BASE = exports.OPENROUTER_SITE_NAME_HEADER = exports.OPENROUTER_SITE_URL_HEADER = exports.OPENROUTER_API_CHAT_URL = exports.TRACE_FILE_PREVIEW_MAX_LENGTH = exports.MODEL_PROVIDER_OPENAI_HOSTS = exports.MODEL_GITHUB_COPILOT_CHAT_CURRENT = exports.MODEL_PROVIDER_MCP = exports.MODEL_PROVIDER_NONE = exports.MODEL_PROVIDER_ECHO = exports.MODEL_PROVIDER_DOCKER_MODEL_RUNNER = exports.MODEL_PROVIDER_WINDOWS_AI = exports.MODEL_PROVIDER_WHISPERASR = exports.MODEL_PROVIDER_DEEPSEEK = exports.MODEL_PROVIDER_VLLM = exports.MODEL_PROVIDER_SGLANG = exports.MODEL_PROVIDER_JAN = exports.MODEL_PROVIDER_LMSTUDIO = exports.MODEL_PROVIDER_MISTRAL = exports.MODEL_PROVIDER_ALIBABA = exports.MODEL_PROVIDER_HUGGINGFACE = exports.MODEL_PROVIDER_ANTHROPIC_BEDROCK = exports.MODEL_PROVIDER_ANTHROPIC = exports.MODEL_PROVIDER_GITHUB_COPILOT_CHAT = exports.MODEL_PROVIDER_LITELLM = exports.MODEL_PROVIDER_LLAMAFILE = exports.MODEL_PROVIDER_OLLAMA = exports.MODEL_PROVIDER_AZURE_SERVERLESS_MODELS = exports.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI = exports.MODEL_PROVIDER_AZURE_AI_INFERENCE = exports.MODEL_PROVIDER_GOOGLE = void 0;
exports.MAX_TOOL_CONTENT_TOKENS = exports.GIT_LOG_COUNT = exports.GIT_DIFF_MAX_TOKENS = exports.CLI_ENV_VAR_RX = exports.GENAISCRIPTIGNORE = exports.GIT_IGNORE_GENAI = exports.GIT_IGNORE = exports.TOKEN_TRUNCATION_THRESHOLD = exports.GITHUB_REST_PAGE_DEFAULT = exports.GITHUB_REST_API_CONCURRENCY_LIMIT = exports.FILE_READ_CONCURRENCY_DEFAULT = exports.PROMISE_QUEUE_CONCURRENCY_DEFAULT = exports.CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT = exports.TEMPLATE_ARG_DATA_SLICE_SAMPLE = exports.TEMPLATE_ARG_FILE_MAX_TOKENS = exports.ANTHROPIC_MAX_TOKEN = exports.DEDENT_INSPECT_MAX_DEPTH = exports.ESTIMATE_TOKEN_OVERHEAD = exports.MAX_TOKENS_ELLIPSE = exports.PLAYWRIGHT_DEFAULT_BROWSER = exports.CONSOLE_TOKEN_INNER_COLORS = exports.CONSOLE_TOKEN_COLORS = exports.CONSOLE_COLOR_ERROR = exports.CONSOLE_COLOR_WARNING = exports.CONSOLE_COLOR_PERFORMANCE = exports.CONSOLE_COLOR_REASONING = exports.CONSOLE_COLOR_DEBUG = exports.CONSOLE_COLOR_INFO = exports.VSCODE_CONFIG_CLI_PACKAGE_MANAGER = exports.VSCODE_CONFIG_CLI_PATH = exports.VSCODE_CONFIG_CLI_VERSION = exports.PLACEHOLDER_API_KEY = exports.PLACEHOLDER_API_BASE = exports.GITHUB_ASSET_BRANCH = exports.GITHUB_PULL_REQUEST_REVIEW_COMMENT_LINE_DISTANCE = exports.GITHUB_PULL_REQUEST_REVIEWS_CACHE = exports.CHAT_CACHE = exports.AI_REQUESTS_CACHE = exports.GITHUB_TOKENS = exports.GITHUB_API_VERSION = exports.CLI_RUN_FILES_FOLDER = exports.DOCKER_CONTAINER_VOLUME = exports.DOCKER_VOLUMES_DIR = exports.DOCKER_DEFAULT_IMAGE = exports.SHELL_EXEC_TIMEOUT = exports.JSON_META_SCHEMA_URI = exports.YAML_MIME_TYPE = exports.MARKDOWN_MIME_TYPE = exports.JAVASCRIPT_MIME_TYPE = exports.JSON_SCHEMA_MIME_TYPE = void 0;
exports.CHAR_FLOPPY_DISK = exports.CHAR_UP_DOWN_ARROWS = exports.CHAR_ENVELOPE = exports.CHAR_DOWN_ARROW = exports.CHAR_UP_ARROW = exports.SERVER_LOCALHOST = exports.PROMPTDOM_PREVIEW_MAX_LENGTH = exports.CONTROL_CHAT_LAST = exports.CONTROL_CHAT_EXPANDED = exports.CONTROL_CHAT_COLLAPSED = exports.PROMPT_DOM_TRUNCATE_ATTEMPTS = exports.REASONING_END_MARKER = exports.REASONING_START_MARKER = exports.STDIN_READ_TIMEOUT = exports.INVALID_FILENAME_REGEX = exports.TEST_CSV_ENTRY_SEPARATOR = exports.MAX_FILE_CONTENT_SIZE = exports.THINK_END_TOKEN_REGEX = exports.THINK_START_TOKEN_REGEX = exports.THINK_REGEX = exports.SCHEMA_DEFAULT_FORMAT = exports.WS_MAX_FRAME_CHUNK_LENGTH = exports.WS_MAX_FRAME_LENGTH = exports.TRACE_MAX_IMAGE_SIZE = exports.TRACE_MAX_FILE_SIZE = exports.TRACE_MAX_FENCE_SIZE = exports.VIDEO_PROBE_DIR_NAME = exports.VIDEO_AUDIO_DIR_NAME = exports.VIDEO_CLIPS_DIR_NAME = exports.VIDEO_FRAMES_DIR_NAME = exports.VIDEO_HASH_LENGTH = exports.VSCODE_STARTUP_TIMEOUT = exports.VSCODE_SERVER_MAX_RETRIES = exports.MIN_LINE_NUMBER_LENGTH = exports.IMAGE_DETAIL_SHORT_SIDE_LIMIT = exports.IMAGE_DETAIL_LONG_SIDE_LIMIT = exports.IMAGE_DETAIL_HIGH_HEIGHT = exports.IMAGE_DETAIL_HIGH_WIDTH = exports.IMAGE_DETAIL_HIGH_TILE_SIZE = exports.IMAGE_DETAIL_LOW_HEIGHT = exports.IMAGE_DETAIL_LOW_WIDTH = exports.SANITIZED_PROMPT_INJECTION = exports.CHOICE_LOGIT_BIAS = exports.TOKEN_NO_ANSWER = exports.TOKEN_MISSING_INFO = exports.AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_DOCUMENTS = exports.AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH = exports.TRANSCRIPTION_CACHE_NAME = exports.AGENT_MEMORY_FLEX_TOKENS = exports.AGENT_MEMORY_CACHE_NAME = void 0;
exports.GITHUB_ASSET_URL_RX = exports.BOX_LEFT_AND_UP = exports.BOX_LEFT_AND_DOWN = exports.BOX_DOWN_UP_AND_RIGHT = exports.BOX_UP_AND_DOWN = exports.BOX_UP_AND_RIGHT = exports.BOX_RIGHT = exports.BOX_DOWN_AND_RIGHT = exports.MAX_STRING_LENGTH_USE_TOKENIZER_FOR_APPROXIMATION = exports.MIN_NODE_VERSION_MAJOR = exports.RESOURCE_MAX_SIZE = exports.MCP_RESOURCE_PROTOCOL = exports.CACHE_SHA_LENGTH = exports.CACHE_FORMAT_VERSION = exports.DEBUG_SCRIPT_CATEGORY = exports.CHAR_TEMPERATURE = void 0;
const llmsdata_js_1 = __importDefault(require("./llmsdata.js"));
exports.CHANGE = "change";
exports.RESOURCE_CHANGE = "resourceChange";
exports.TRACE_CHUNK = "traceChunk";
exports.TRACE_DETAILS = "traceDetails";
exports.RECONNECT = "reconnect";
exports.OPEN = "open";
exports.CLOSE = "close";
exports.READY = "ready";
exports.MESSAGE = "message";
exports.ERROR = "error";
exports.CONNECT = "connect";
exports.LOG = "log";
exports.QUEUE_SCRIPT_START = "queueScriptStart";
exports.MAX_TOOL_CALLS = 10000;
exports.MAX_TOOL_DESCRIPTION_LENGTH = 1000;
// https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
// https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cognitiveservices/data-plane/AzureOpenAI/inference/stable/2024-02-01/inference.yaml
// https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
exports.AZURE_OPENAI_API_VERSION = "2025-04-01-preview";
exports.AZURE_MANAGEMENT_API_VERSION = "2024-10-01";
exports.AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES = Object.freeze([
    "https://cognitiveservices.azure.com/.default",
]);
// https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
exports.AZURE_AI_INFERENCE_VERSION = "2025-03-01-preview";
exports.AZURE_AI_INFERENCE_TOKEN_SCOPES = Object.freeze(["https://ml.azure.com/.default"]);
exports.AZURE_MANAGEMENT_TOKEN_SCOPES = Object.freeze([
    "https://management.azure.com/.default",
]);
exports.AZURE_TOKEN_EXPIRATION = 59 * 60_000; // 59 minutes
exports.DOCS_URL = "https://microsoft.github.io/genaiscript";
exports.TOOL_URL = exports.DOCS_URL;
exports.TOOL_ID = "genaiscript";
exports.GENAISCRIPT_FOLDER = "." + exports.TOOL_ID;
exports.GENAI_SRC = "genaisrc";
exports.GENAI_JS_EXT = ".genai.js";
exports.GENAI_MJS_EXT = ".genai.mjs";
exports.GENAI_MTS_EXT = ".genai.mts";
exports.GENAI_MD_EXT = ".genai.md";
exports.GENAI_ANYJS_GLOB = "**/*{.genai.js,.genai.mjs,.genai.ts,.genai.mts,.genai.md}";
exports.NEGATIVE_GLOB_REGEX = /^!/;
exports.GENAI_ANY_REGEX = /\.genai\.(ts|mts|mjs|js|md)$/i;
exports.GENAI_ANYJS_REGEX = /\.genai\.js$/i;
exports.GENAI_ANYTS_REGEX = /\.genai\.(ts|mts|mjs)$/i;
exports.GENAI_MD_REGEX = /\.genai\.md$/i;
exports.HTTP_OR_S_REGEX = /^https?:\/\//i;
exports.HTTPS_REGEX = /^https:\/\//i;
exports.CSV_REGEX = /\.(t|c)sv$/i;
exports.YAML_REGEX = /\.yaml$/i;
exports.INI_REGEX = /\.ini$/i;
exports.TOML_REGEX = /\.toml$/i;
exports.XLSX_REGEX = /\.xlsx$/i;
exports.XML_REGEX = /\.xml$/i;
exports.DOCX_REGEX = /\.docx$/i;
exports.PDF_REGEX = /\.pdf$/i;
exports.MD_REGEX = /\.md$/i;
exports.MDX_REGEX = /\.mdx$/i;
exports.MJS_REGEX = /\.mjs$/i;
exports.MJTS_REGEX = /\.m(j|t)s$/i;
exports.JS_REGEX = /\.js$/i;
exports.TS_IMPORT_REGEX = /\.(ts|mts|mjs)$/i;
exports.JSON5_REGEX = /\.json5?$/i;
exports.JSONL_REGEX = /\.jsonl$/i;
exports.PROMPTY_REGEX = /\.prompty$/i;
exports.TOOL_NAME = "GenAIScript";
exports.SERVER_PORT = 8003;
exports.OPENAPI_SERVER_PORT = 3000;
exports.CLIENT_RECONNECT_DELAY = 3000;
exports.CLIENT_RECONNECT_MAX_ATTEMPTS = 20;
exports.RETRIEVAL_PERSIST_DIR = "retrieval";
exports.HIGHLIGHT_LENGTH = 4000;
exports.SMALL_MODEL_ID = "small";
exports.LARGE_MODEL_ID = "large";
exports.VISION_MODEL_ID = "vision";
exports.TRANSCRIPTION_MODEL_ID = "transcription";
exports.SPEECH_MODEL_ID = "speech";
exports.IMAGE_GENERATION_MODEL_ID = "image";
exports.EMBEDDINGS_MODEL_ID = "embeddings";
exports.DEFAULT_FENCE_FORMAT = "xml";
exports.DEFAULT_TEMPERATURE = 0.8;
exports.TRACE_NODE_PREFIX = "genaiscript/trace/";
exports.EXTENSION_ID = "genaiscript.genaiscript-vscode";
exports.COPILOT_CHAT_PARTICIPANT_ID = exports.TOOL_ID;
exports.COPILOT_CHAT_PARTICIPANT_SCRIPT_ID = "copilotchat";
exports.TAVILY_ENDPOINT = "https://api.tavily.com/search";
exports.SYSTEM_FENCE = "\n";
exports.MAX_DATA_REPAIRS = 1;
exports.NPM_CLI_PACKAGE = "genaiscript";
exports.ICON_LOGO_NAME = "genaiscript-logo";
exports.SARIFF_RULEID_PREFIX = "genaiscript/";
exports.SARIFF_BUILDER_URL = "https://github.com/microsoft/genaiscript/";
exports.SARIFF_BUILDER_TOOL_DRIVER_NAME = exports.TOOL_ID;
exports.OPENAI_MAX_RETRY_DELAY = 60000; // 60s
exports.OPENAI_MAX_RETRY_COUNT = 10;
exports.OPENAI_RETRY_DEFAULT_DEFAULT = 1000;
exports.OPENAI_MAX_RETRY_AFTER_DEFAULT = 300000; // 300s
exports.FETCH_RETRY_DEFAULT = 6;
exports.FETCH_RETRY_DELAY_DEFAULT = 2000;
exports.FETCH_RETRY_MIN_DELAY_DEFAULT = 2000; // 2s
exports.FETCH_RETRY_MAX_DELAY_DEFAULT = 60000; // 60s
exports.FETCH_RETRY_MAX_RETRY_AFTER_DEFAULT = 300000; // 300s
exports.FETCH_RETRY_GROWTH_FACTOR = 1.5;
exports.FETCH_RETRY_ON_DEFAULT = [408, 429, 500, 502, 504];
exports.EXEC_MAX_BUFFER = 64;
exports.DOT_ENV_FILENAME = ".env";
exports.DOT_ENV_GENAISCRIPT_FILENAME = ".env.genaiscript";
exports.SUCCESS_ERROR_CODE = 0;
exports.UNHANDLED_ERROR_CODE = -1;
exports.ANNOTATION_ERROR_CODE = -2;
exports.FILES_NOT_FOUND_ERROR_CODE = -3;
exports.GENERATION_ERROR_CODE = -4;
exports.RUNTIME_ERROR_CODE = -5;
exports.CONNECTION_CONFIGURATION_ERROR_CODE = -6;
exports.USER_CANCELLED_ERROR_CODE = -7;
exports.CONFIGURATION_ERROR_CODE = -8;
exports.UNRECOVERABLE_ERROR_CODES = Object.freeze([
    exports.CONNECTION_CONFIGURATION_ERROR_CODE,
    exports.USER_CANCELLED_ERROR_CODE,
    exports.FILES_NOT_FOUND_ERROR_CODE,
    exports.ANNOTATION_ERROR_CODE,
]);
exports.DOT_ENV_REGEX = /\.env(\.[^/]+)?$/i;
exports.PROMPT_FENCE = "```";
exports.MARKDOWN_PROMPT_FENCE = "`````";
exports.OPENAI_API_BASE = "https://api.openai.com/v1";
exports.OLLAMA_DEFAULT_PORT = 11434;
exports.OLLAMA_API_BASE = `http://127.0.0.1:${exports.OLLAMA_DEFAULT_PORT}/v1`;
exports.SGLANG_API_BASE = "http://127.0.0.1:30000/v1";
exports.VLLM_API_BASE = "http://127.0.0.1:8000/v1";
exports.LLAMAFILE_API_BASE = "http://127.0.0.1:8080/v1";
exports.LOCALAI_API_BASE = "http://127.0.0.1:8080/v1";
exports.LITELLM_API_BASE = "http://127.0.0.1:4000";
exports.LMSTUDIO_API_BASE = "http://127.0.0.1:1234/v1";
exports.JAN_API_BASE = "http://127.0.0.1:1337/v1";
exports.ANTHROPIC_API_BASE = "https://api.anthropic.com";
exports.HUGGINGFACE_API_BASE = "https://router.huggingface.co/v1/";
exports.GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/";
exports.ALIBABA_BASE = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
exports.MISTRAL_API_BASE = "https://api.mistral.ai/v1";
exports.DEEPSEEK_API_BASE = "https://api.deepseek.com/v1";
exports.WHISPERASR_API_BASE = "http://localhost:9000";
exports.WINDOWS_AI_API_BASE = "http://127.0.0.1:5272/v1";
exports.DOCKER_MODEL_RUNNER_API_BASE = "http://model-runner.docker.internal/engines/v1/";
exports.PROMPTFOO_CACHE_PATH = ".genaiscript/cache/tests";
exports.PROMPTFOO_CONFIG_DIR = ".genaiscript/config/tests";
exports.PROMPTFOO_REMOTE_API_PORT = 15500;
exports.PROMPTFOO_REDTEAM_NUM_TESTS = 5;
exports.PROMPTFOO_TEST_MAX_CONCURRENCY = 1;
exports.TYPE_DEFINITION_BASENAME = "genaiscript.d.ts";
exports.TYPE_DEFINITION_REFERENCE = `/// <reference path="./${exports.TYPE_DEFINITION_BASENAME}" />\n`;
exports.RUNS_DIR_NAME = "runs";
exports.CONVERTS_DIR_NAME = "converts";
exports.TEST_RUNS_DIR_NAME = "test-runs";
exports.STATS_DIR_NAME = "stats";
exports.TRACE_FILENAME = "trace.md";
exports.OUTPUT_FILENAME = "readme.md";
exports.EMOJI_SUCCESS = "✅";
exports.EMOJI_FAIL = "❌";
exports.EMOJI_WARNING = "⚠️";
exports.EMOJI_UNDEFINED = "?";
exports.MODEL_PROVIDER_OPENAI = "openai";
exports.MODEL_PROVIDER_GITHUB = "github";
exports.MODEL_PROVIDER_AZURE_OPENAI = "azure";
exports.MODEL_PROVIDER_GOOGLE = "google";
exports.MODEL_PROVIDER_AZURE_AI_INFERENCE = "azure_ai_inference";
exports.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI = "azure_serverless";
exports.MODEL_PROVIDER_AZURE_SERVERLESS_MODELS = "azure_serverless_models";
exports.MODEL_PROVIDER_OLLAMA = "ollama";
exports.MODEL_PROVIDER_LLAMAFILE = "llamafile";
exports.MODEL_PROVIDER_LITELLM = "litellm";
exports.MODEL_PROVIDER_GITHUB_COPILOT_CHAT = "github_copilot_chat";
exports.MODEL_PROVIDER_ANTHROPIC = "anthropic";
exports.MODEL_PROVIDER_ANTHROPIC_BEDROCK = "anthropic_bedrock";
exports.MODEL_PROVIDER_HUGGINGFACE = "huggingface";
exports.MODEL_PROVIDER_ALIBABA = "alibaba";
exports.MODEL_PROVIDER_MISTRAL = "mistral";
exports.MODEL_PROVIDER_LMSTUDIO = "lmstudio";
exports.MODEL_PROVIDER_JAN = "jan";
exports.MODEL_PROVIDER_SGLANG = "sglang";
exports.MODEL_PROVIDER_VLLM = "vllm";
exports.MODEL_PROVIDER_DEEPSEEK = "deepseek";
exports.MODEL_PROVIDER_WHISPERASR = "whisperasr";
exports.MODEL_PROVIDER_WINDOWS_AI = "windows";
exports.MODEL_PROVIDER_DOCKER_MODEL_RUNNER = "docker";
exports.MODEL_PROVIDER_ECHO = "echo";
exports.MODEL_PROVIDER_NONE = "none";
exports.MODEL_PROVIDER_MCP = "mcp";
exports.MODEL_GITHUB_COPILOT_CHAT_CURRENT = exports.MODEL_PROVIDER_GITHUB_COPILOT_CHAT + ":current";
exports.MODEL_PROVIDER_OPENAI_HOSTS = Object.freeze([
    exports.MODEL_PROVIDER_OPENAI,
    exports.MODEL_PROVIDER_GITHUB,
    exports.MODEL_PROVIDER_AZURE_OPENAI,
    exports.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
]);
exports.TRACE_FILE_PREVIEW_MAX_LENGTH = 240;
exports.OPENROUTER_API_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
exports.OPENROUTER_SITE_URL_HEADER = "HTTP-Referer";
exports.OPENROUTER_SITE_NAME_HEADER = "X-Title";
exports.GITHUB_MODELS_BASE = "https://models.github.ai/inference";
exports.DOCS_CONFIGURATION_URL = "https://microsoft.github.io/genaiscript/getting-started/configuration/";
exports.DOCS_CONFIGURATION_CONTENT_SAFETY_URL = "https://microsoft.github.io/genaiscript/reference/scripts/content-safety";
exports.DOCS_DEF_FILES_IS_EMPTY_URL = "https://microsoft.github.io/genaiscript/reference/scripts/context/#empty-files";
exports.DOCS_WEB_SEARCH_URL = "https://microsoft.github.io/genaiscript/reference/scripts/web-search/";
exports.DOCS_WEB_SEARCH_BING_SEARCH_URL = "https://microsoft.github.io/genaiscript/reference/scripts/web-search/#bingn";
exports.DOCS_WEB_SEARCH_TAVILY_URL = "https://microsoft.github.io/genaiscript/reference/scripts/web-search/#tavily";
exports.MODEL_PROVIDERS = Object.freeze(llmsdata_js_1.default.providers);
exports.MODEL_PRICINGS = Object.freeze(llmsdata_js_1.default.pricings);
exports.NEW_SCRIPT_TEMPLATE = `$\`Write a short poem in code.\`
`;
exports.PDF_SCALE = 4;
exports.PDF_HASH_LENGTH = 22;
exports.DOCX_HASH_LENGTH = 22;
exports.VECTOR_INDEX_HASH_LENGTH = 22;
exports.RESOURCE_HASH_LENGTH = 22;
exports.FILE_HASH_LENGTH = 64;
exports.PDF_MIME_TYPE = "application/pdf";
exports.DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
exports.XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
exports.JSON_MIME_TYPE = "application/json";
exports.JSON_SCHEMA_MIME_TYPE = "application/schema+json";
exports.JAVASCRIPT_MIME_TYPE = "application/javascript";
exports.MARKDOWN_MIME_TYPE = "text/markdown";
exports.YAML_MIME_TYPE = "application/yaml";
exports.JSON_META_SCHEMA_URI = "https://json-schema.org/draft/2020-12/schema";
exports.SHELL_EXEC_TIMEOUT = 300000;
exports.DOCKER_DEFAULT_IMAGE = "python:alpine";
exports.DOCKER_VOLUMES_DIR = "containers";
exports.DOCKER_CONTAINER_VOLUME = "app";
exports.CLI_RUN_FILES_FOLDER = "files";
exports.GITHUB_API_VERSION = "2022-11-28";
exports.GITHUB_TOKENS = ["GITHUB_TOKEN", "GH_TOKEN", "INPUT_GITHUB_TOKEN"];
exports.AI_REQUESTS_CACHE = "airaireequests";
exports.CHAT_CACHE = "chat";
exports.GITHUB_PULL_REQUEST_REVIEWS_CACHE = "prr";
exports.GITHUB_PULL_REQUEST_REVIEW_COMMENT_LINE_DISTANCE = 5;
exports.GITHUB_ASSET_BRANCH = "genai-assets";
exports.PLACEHOLDER_API_BASE = "<custom api base>";
exports.PLACEHOLDER_API_KEY = "<your token>";
exports.VSCODE_CONFIG_CLI_VERSION = "cli.version";
exports.VSCODE_CONFIG_CLI_PATH = "cli.path";
exports.VSCODE_CONFIG_CLI_PACKAGE_MANAGER = "cli.packageManager";
exports.CONSOLE_COLOR_INFO = 32;
exports.CONSOLE_COLOR_DEBUG = 90;
exports.CONSOLE_COLOR_REASONING = "38;5;17";
exports.CONSOLE_COLOR_PERFORMANCE = "38;5;17";
exports.CONSOLE_COLOR_WARNING = 95;
exports.CONSOLE_COLOR_ERROR = 91;
exports.CONSOLE_TOKEN_COLORS = [90, 37];
// export const CONSOLE_TOKEN_COLORS = [97, 93]
exports.CONSOLE_TOKEN_INNER_COLORS = [90, 37];
exports.PLAYWRIGHT_DEFAULT_BROWSER = "chromium";
exports.MAX_TOKENS_ELLIPSE = "...";
exports.ESTIMATE_TOKEN_OVERHEAD = 2;
exports.DEDENT_INSPECT_MAX_DEPTH = 3;
exports.ANTHROPIC_MAX_TOKEN = 4096;
exports.TEMPLATE_ARG_FILE_MAX_TOKENS = 4000;
exports.TEMPLATE_ARG_DATA_SLICE_SAMPLE = 2000;
exports.CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT = 8;
exports.PROMISE_QUEUE_CONCURRENCY_DEFAULT = 16;
exports.FILE_READ_CONCURRENCY_DEFAULT = 16;
exports.GITHUB_REST_API_CONCURRENCY_LIMIT = 8;
exports.GITHUB_REST_PAGE_DEFAULT = 10;
exports.TOKEN_TRUNCATION_THRESHOLD = 16;
exports.GIT_IGNORE = ".gitignore";
exports.GIT_IGNORE_GENAI = ".gitignore.genai";
exports.GENAISCRIPTIGNORE = ".genaiscriptignore";
exports.CLI_ENV_VAR_RX = /^(genaiscript_var_|input_)/i;
exports.GIT_DIFF_MAX_TOKENS = 8000;
exports.GIT_LOG_COUNT = 10;
exports.MAX_TOOL_CONTENT_TOKENS = 8000;
exports.AGENT_MEMORY_CACHE_NAME = "agent_memory";
exports.AGENT_MEMORY_FLEX_TOKENS = 20000;
exports.TRANSCRIPTION_CACHE_NAME = "transcriptions";
exports.AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH = 9000;
exports.AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_DOCUMENTS = 9000;
exports.TOKEN_MISSING_INFO = "<MISSING_INFO>";
exports.TOKEN_NO_ANSWER = "<NO_ANSWER>";
exports.CHOICE_LOGIT_BIAS = 5;
exports.SANITIZED_PROMPT_INJECTION = "...prompt injection detected, content removed...";
// https://platform.openai.com/docs/guides/vision/calculating-costs#managing-images
exports.IMAGE_DETAIL_LOW_WIDTH = 512;
exports.IMAGE_DETAIL_LOW_HEIGHT = 512;
exports.IMAGE_DETAIL_HIGH_TILE_SIZE = 512;
exports.IMAGE_DETAIL_HIGH_WIDTH = 2048;
exports.IMAGE_DETAIL_HIGH_HEIGHT = 2048;
exports.IMAGE_DETAIL_LONG_SIDE_LIMIT = 2000;
exports.IMAGE_DETAIL_SHORT_SIDE_LIMIT = 768;
exports.MIN_LINE_NUMBER_LENGTH = 10;
exports.VSCODE_SERVER_MAX_RETRIES = 5;
exports.VSCODE_STARTUP_TIMEOUT = 5000;
exports.VIDEO_HASH_LENGTH = 18;
exports.VIDEO_FRAMES_DIR_NAME = "frames";
exports.VIDEO_CLIPS_DIR_NAME = "clips";
exports.VIDEO_AUDIO_DIR_NAME = "audio";
exports.VIDEO_PROBE_DIR_NAME = "probe";
exports.TRACE_MAX_FENCE_SIZE = 100 * 1024; // 100kb
exports.TRACE_MAX_FILE_SIZE = 128 * 1024; // 128kb
exports.TRACE_MAX_IMAGE_SIZE = 32 * 1024; // 32kb
exports.WS_MAX_FRAME_LENGTH = 1200000;
exports.WS_MAX_FRAME_CHUNK_LENGTH = 1000000;
exports.SCHEMA_DEFAULT_FORMAT = "json";
exports.THINK_REGEX = /<think>(.*?)($|<\/think>)/gis;
exports.THINK_START_TOKEN_REGEX = /^<think>/;
exports.THINK_END_TOKEN_REGEX = /<\/think>$/;
exports.MAX_FILE_CONTENT_SIZE = 1024 * 1024 * 2; // 2MB
exports.TEST_CSV_ENTRY_SEPARATOR = /[;|\n]/g;
// eslint-disable-next-line no-control-regex
exports.INVALID_FILENAME_REGEX = /[<>:"/\\|?*\x00-\x1F]+/g;
exports.STDIN_READ_TIMEOUT = 50;
exports.REASONING_START_MARKER = "\n🤔 <thinking>\n";
exports.REASONING_END_MARKER = "\n</thinking>\n\n";
exports.PROMPT_DOM_TRUNCATE_ATTEMPTS = 6;
exports.CONTROL_CHAT_COLLAPSED = 3;
exports.CONTROL_CHAT_EXPANDED = 6;
exports.CONTROL_CHAT_LAST = 12;
exports.PROMPTDOM_PREVIEW_MAX_LENGTH = 512;
exports.SERVER_LOCALHOST = "http://127.0.0.1";
exports.CHAR_UP_ARROW = "↑";
exports.CHAR_DOWN_ARROW = "↓";
exports.CHAR_ENVELOPE = "✉";
exports.CHAR_UP_DOWN_ARROWS = "⇅ ";
exports.CHAR_FLOPPY_DISK = "🖫 ";
exports.CHAR_TEMPERATURE = "°";
exports.DEBUG_SCRIPT_CATEGORY = "script";
exports.CACHE_FORMAT_VERSION = "1";
exports.CACHE_SHA_LENGTH = 32;
exports.MCP_RESOURCE_PROTOCOL = exports.TOOL_ID;
exports.RESOURCE_MAX_SIZE = 1024 * 1024 * 10; // 10MB
exports.MIN_NODE_VERSION_MAJOR = 22;
exports.MAX_STRING_LENGTH_USE_TOKENIZER_FOR_APPROXIMATION = 10000;
exports.BOX_DOWN_AND_RIGHT = "╭";
exports.BOX_RIGHT = "─";
exports.BOX_UP_AND_RIGHT = "╰";
exports.BOX_UP_AND_DOWN = "│";
exports.BOX_DOWN_UP_AND_RIGHT = "├";
exports.BOX_LEFT_AND_DOWN = "╮";
exports.BOX_LEFT_AND_UP = "╯";
exports.GITHUB_ASSET_URL_RX = /^https:\/\/github\.com\/.*\/assets\/.*$/i;
//# sourceMappingURL=constants.js.map