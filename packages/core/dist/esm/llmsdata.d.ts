declare const _default: {
  $schema: string;
  providers: (
    | {
        id: string;
        detail: string;
        url: string;
        bearerToken: boolean;
        transcribe: boolean;
        speech: boolean;
        listModels: boolean;
        imageGeneration: boolean;
        responseFormat: string;
        metadata: boolean;
        aliases: {
          large: string;
          small: string;
          tiny: string;
          vision: string;
          vision_small: string;
          embeddings: string;
          reasoning: string;
          reasoning_small: string;
          transcription: string;
          speech: string;
          image: string;
          intent: string;
          long?: undefined;
        };
        models: {
          "o1-preview": {
            tools: boolean;
          };
          "o1-mini": {
            tools: boolean;
          };
          "phi-3.5-mini-instruct": {
            tools: boolean;
          };
          "marco-o1"?: undefined;
          tulu3?: undefined;
          opencoder?: undefined;
          "llama3.2-vision"?: undefined;
          "phi3.5"?: undefined;
          gemma2?: undefined;
          "deep-seek-coder-v2"?: undefined;
          codegemma?: undefined;
          llava?: undefined;
          llama3?: undefined;
          gemma?: undefined;
          qwen?: undefined;
          phi3?: undefined;
          llama2?: undefined;
          codellama?: undefined;
          phi?: undefined;
          "deepseek-r1"?: undefined;
          gemma3?: undefined;
        };
        env: {
          OPENAI_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          OPENAI_API_BASE: {
            description: string;
          };
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        prediction?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        listModels: boolean;
        bearerToken: boolean;
        prediction: boolean;
        transcribe: boolean;
        speech: boolean;
        imageGeneration: boolean;
        aliases: {
          large?: undefined;
          small?: undefined;
          tiny?: undefined;
          vision?: undefined;
          vision_small?: undefined;
          embeddings?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        metadata: boolean;
        models: {
          "o1-preview": {
            tools: boolean;
          };
          "o1-mini": {
            tools: boolean;
          };
          "phi-3.5-mini-instruct": {
            tools: boolean;
          };
          "marco-o1"?: undefined;
          tulu3?: undefined;
          opencoder?: undefined;
          "llama3.2-vision"?: undefined;
          "phi3.5"?: undefined;
          gemma2?: undefined;
          "deep-seek-coder-v2"?: undefined;
          codegemma?: undefined;
          llava?: undefined;
          llama3?: undefined;
          gemma?: undefined;
          qwen?: undefined;
          phi3?: undefined;
          llama2?: undefined;
          codellama?: undefined;
          phi?: undefined;
          "deepseek-r1"?: undefined;
          gemma3?: undefined;
        };
        env: {
          AZURE_OPENAI_API_ENDPOINT: {
            description: string;
            required: boolean;
            format: string;
          };
          AZURE_OPENAI_API_KEY: {
            description: string;
            secret: boolean;
          };
          AZURE_OPENAI_SUBSCRIPTION_ID: {
            description: string;
          };
          AZURE_OPENAI_API_VERSION: {
            description: string;
          };
          AZURE_OPENAI_API_CREDENTIALS: {
            description: string;
            enum: string[];
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        responseFormat?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        listModels: boolean;
        bearerToken: boolean;
        prediction: boolean;
        logprobs: boolean;
        topLogprobs: boolean;
        aliases: {
          large: string;
          small: string;
          vision: string;
          vision_small: string;
          reasoning: string;
          reasoning_small: string;
          embeddings: string;
          tiny?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        models: {
          "o1-preview": {
            tools: boolean;
          };
          "o1-mini": {
            tools: boolean;
          };
          "phi-3.5-mini-instruct": {
            tools: boolean;
          };
          "marco-o1"?: undefined;
          tulu3?: undefined;
          opencoder?: undefined;
          "llama3.2-vision"?: undefined;
          "phi3.5"?: undefined;
          gemma2?: undefined;
          "deep-seek-coder-v2"?: undefined;
          codegemma?: undefined;
          llava?: undefined;
          llama3?: undefined;
          gemma?: undefined;
          qwen?: undefined;
          phi3?: undefined;
          llama2?: undefined;
          codellama?: undefined;
          phi?: undefined;
          "deepseek-r1"?: undefined;
          gemma3?: undefined;
        };
        env: {
          AZURE_AI_INFERENCE_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          AZURE_AI_INFERENCE_API_ENDPOINT: {
            description: string;
            required: boolean;
          };
          AZURE_AI_INFERENCE_API_VERSION: {
            description: string;
          };
          AZURE_AI_INFERENCE_API_CREDENTIALS: {
            description: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        listModels: boolean;
        bearerToken: boolean;
        prediction: boolean;
        aliases: {
          large: string;
          small: string;
          vision: string;
          vision_small: string;
          reasoning: string;
          reasoning_small: string;
          embeddings: string;
          tiny?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        models: {
          "o1-preview": {
            tools: boolean;
          };
          "o1-mini": {
            tools: boolean;
          };
          "phi-3.5-mini-instruct": {
            tools: boolean;
          };
          "marco-o1"?: undefined;
          tulu3?: undefined;
          opencoder?: undefined;
          "llama3.2-vision"?: undefined;
          "phi3.5"?: undefined;
          gemma2?: undefined;
          "deep-seek-coder-v2"?: undefined;
          codegemma?: undefined;
          llava?: undefined;
          llama3?: undefined;
          gemma?: undefined;
          qwen?: undefined;
          phi3?: undefined;
          llama2?: undefined;
          codellama?: undefined;
          phi?: undefined;
          "deepseek-r1"?: undefined;
          gemma3?: undefined;
        };
        env: {
          AZURE_SERVERLESS_OPENAI_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          AZURE_SERVERLESS_OPENAI_ENDPOINT: {
            description: string;
            required: boolean;
          };
          AZURE_SERVERLESS_OPENAI_API_VERSION: {
            description: string;
          };
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS: {
            description: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        listModels: boolean;
        prediction: boolean;
        bearerToken: boolean;
        env: {
          AZURE_SERVERLESS_MODELS_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          AZURE_SERVERLESS_MODELS_ENDPOINT: {
            description: string;
            required: boolean;
          };
          AZURE_SERVERLESS_MODELS_API_VERSION: {
            description: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        logprobs: boolean;
        topLogprobs: boolean;
        limitations: string;
        prediction: boolean;
        listModels: boolean;
        bearerToken: boolean;
        aliases: {
          large: string;
          small: string;
          tiny: string;
          vision: string;
          embeddings: string;
          reasoning: string;
          reasoning_small: string;
          vision_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        models: {
          "o1-preview": {
            tools: boolean;
          };
          "o1-mini": {
            tools: boolean;
          };
          "phi-3.5-mini-instruct": {
            tools: boolean;
          };
          "marco-o1"?: undefined;
          tulu3?: undefined;
          opencoder?: undefined;
          "llama3.2-vision"?: undefined;
          "phi3.5"?: undefined;
          gemma2?: undefined;
          "deep-seek-coder-v2"?: undefined;
          codegemma?: undefined;
          llava?: undefined;
          llama3?: undefined;
          gemma?: undefined;
          qwen?: undefined;
          phi3?: undefined;
          llama2?: undefined;
          codellama?: undefined;
          phi?: undefined;
          "deepseek-r1"?: undefined;
          gemma3?: undefined;
        };
        env: {
          GITHUB_TOKEN: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        logitBias: boolean;
        openaiCompatibility: string;
        prediction: boolean;
        bearerToken: boolean;
        tokenless: boolean;
        aliases: {
          embeddings: string;
          large?: undefined;
          small?: undefined;
          tiny?: undefined;
          vision?: undefined;
          vision_small?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          OLLAMA_HOST: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        models: {
          "marco-o1": {
            tools: boolean;
          };
          tulu3: {
            tools: boolean;
          };
          opencoder: {
            tools: boolean;
          };
          "llama3.2-vision": {
            tools: boolean;
          };
          "phi3.5": {
            tools: boolean;
          };
          gemma2: {
            tools: boolean;
          };
          "deep-seek-coder-v2": {
            tools: boolean;
          };
          codegemma: {
            tools: boolean;
          };
          llava: {
            tools: boolean;
          };
          llama3: {
            tools: boolean;
          };
          gemma: {
            tools: boolean;
          };
          qwen: {
            tools: boolean;
          };
          phi3: {
            tools: boolean;
          };
          llama2: {
            tools: boolean;
          };
          codellama: {
            tools: boolean;
          };
          phi: {
            tools: boolean;
          };
          "deepseek-r1": {
            tools: boolean;
          };
          gemma3: {
            tools: boolean;
          };
          "o1-preview"?: undefined;
          "o1-mini"?: undefined;
          "phi-3.5-mini-instruct"?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        tokenless: boolean;
        listModels: boolean;
        imageGeneration: boolean;
        speech: boolean;
        aliases: {
          small: string;
          large?: undefined;
          tiny?: undefined;
          vision?: undefined;
          vision_small?: undefined;
          embeddings?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        env?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        logprobs: boolean;
        topLogprobs: boolean;
        prediction: boolean;
        aliases: {
          large: string;
          small: string;
          vision: string;
          vision_small: string;
          reasoning: string;
          reasoning_small: string;
          tiny?: undefined;
          embeddings?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        reasoningEfforts: {
          low: number;
          medium: number;
          high: number;
        };
        env: {
          ANTHROPIC_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          ANTHROPIC_API_BASE: {
            description: string;
          };
          ANTHROPIC_API_VERSION: {
            description: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        logprobs: boolean;
        topLogprobs: boolean;
        prediction: boolean;
        reasoningEfforts: {
          low: number;
          medium: number;
          high: number;
        };
        aliases: {
          reasoning: string;
          reasoning_small: string;
          large: string;
          small: string;
          vision: string;
          vision_small: string;
          tiny?: undefined;
          embeddings?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        seed: boolean;
        tools: boolean;
        logprobs: boolean;
        topLogprobs: boolean;
        openaiCompatibility: string;
        prediction: boolean;
        bearerToken: boolean;
        listModels: boolean;
        aliases: {
          large: string;
          small: string;
          vision: string;
          long: string;
          reasoning: string;
          reasoning_small: string;
          embeddings: string;
          tiny?: undefined;
          vision_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
        };
        env: {
          GEMINI_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          GEMINI_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        listModels: boolean;
        openaiCompatibility: string;
        aliases: {
          large: string;
          small: string;
          vision: string;
          embeddings: string;
          tiny?: undefined;
          vision_small?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          HUGGINGFACE_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          HUGGINGFACE_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        bearerToken: boolean;
        aliases: {
          large: string;
          small: string;
          vision: string;
          tiny?: undefined;
          vision_small?: undefined;
          embeddings?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          MISTRAL_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          MISTRAL_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        openaiCompatibility: string;
        tools: boolean;
        prediction: boolean;
        listModels: boolean;
        bearerToken: boolean;
        aliases: {
          large: string;
          small: string;
          long: string;
          embeddings: string;
          tiny?: undefined;
          vision?: undefined;
          vision_small?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
        };
        env: {
          ALIBABA_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          ALIBABA_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        bearerToken: boolean;
        aliases: {
          large: string;
          small: string;
          vision: string;
          tiny?: undefined;
          vision_small?: undefined;
          embeddings?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          DEEPSEEK_API_KEY: {
            description: string;
            required: boolean;
            secret: boolean;
          };
          DEEPSEEK_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        url?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        prediction?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        tokenless?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        bearerToken: boolean;
        tokenless: boolean;
        aliases: {
          embeddings: string;
          large?: undefined;
          small?: undefined;
          tiny?: undefined;
          vision?: undefined;
          vision_small?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          LMSTUDIO_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        listModels: boolean;
        tokenless: boolean;
        topP: boolean;
        env: {
          DOCKER_MODEL_RUNNER_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        listModels: boolean;
        tokenless: boolean;
        topP: boolean;
        env: {
          JAN_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        tokenless: boolean;
        singleModel: boolean;
        listModels: boolean;
        speech: boolean;
        pullModel: boolean;
        env: {
          LLAMAFILE_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        prediction: boolean;
        tokenless: boolean;
        listModels: boolean;
        speech: boolean;
        pullModel: boolean;
        env: {
          SGLANG_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        openaiCompatibility: string;
        prediction: boolean;
        tokenless: boolean;
        listModels: boolean;
        speech: boolean;
        pullModel: boolean;
        env: {
          VLLM_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        prediction: boolean;
        tokenless: boolean;
        env: {
          LITELLM_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        url?: undefined;
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        url: string;
        tokenless: boolean;
        aliases: {
          transcription: string;
          large?: undefined;
          small?: undefined;
          tiny?: undefined;
          vision?: undefined;
          vision_small?: undefined;
          embeddings?: undefined;
          reasoning?: undefined;
          reasoning_small?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          WHISPERASR_API_BASE: {
            description: string;
            format: string;
          };
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
        };
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        prediction?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        tools?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        detail: string;
        hidden: boolean;
        tools: boolean;
        prediction: boolean;
        tokenless: boolean;
        aliases: {
          large: string;
          small: string;
          reasoning: string;
          reasoning_small: string;
          tiny?: undefined;
          vision?: undefined;
          vision_small?: undefined;
          embeddings?: undefined;
          transcription?: undefined;
          speech?: undefined;
          image?: undefined;
          intent?: undefined;
          long?: undefined;
        };
        env: {
          OPENAI_API_KEY?: undefined;
          OPENAI_API_BASE?: undefined;
          AZURE_OPENAI_API_ENDPOINT?: undefined;
          AZURE_OPENAI_API_KEY?: undefined;
          AZURE_OPENAI_SUBSCRIPTION_ID?: undefined;
          AZURE_OPENAI_API_VERSION?: undefined;
          AZURE_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_AI_INFERENCE_API_KEY?: undefined;
          AZURE_AI_INFERENCE_API_ENDPOINT?: undefined;
          AZURE_AI_INFERENCE_API_VERSION?: undefined;
          AZURE_AI_INFERENCE_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_OPENAI_API_KEY?: undefined;
          AZURE_SERVERLESS_OPENAI_ENDPOINT?: undefined;
          AZURE_SERVERLESS_OPENAI_API_VERSION?: undefined;
          AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?: undefined;
          AZURE_SERVERLESS_MODELS_API_KEY?: undefined;
          AZURE_SERVERLESS_MODELS_ENDPOINT?: undefined;
          AZURE_SERVERLESS_MODELS_API_VERSION?: undefined;
          GITHUB_TOKEN?: undefined;
          OLLAMA_HOST?: undefined;
          ANTHROPIC_API_KEY?: undefined;
          ANTHROPIC_API_BASE?: undefined;
          ANTHROPIC_API_VERSION?: undefined;
          GEMINI_API_KEY?: undefined;
          GEMINI_API_BASE?: undefined;
          HUGGINGFACE_API_KEY?: undefined;
          HUGGINGFACE_API_BASE?: undefined;
          MISTRAL_API_KEY?: undefined;
          MISTRAL_API_BASE?: undefined;
          ALIBABA_API_KEY?: undefined;
          ALIBABA_API_BASE?: undefined;
          DEEPSEEK_API_KEY?: undefined;
          DEEPSEEK_API_BASE?: undefined;
          LMSTUDIO_API_BASE?: undefined;
          DOCKER_MODEL_RUNNER_API_BASE?: undefined;
          JAN_API_BASE?: undefined;
          LLAMAFILE_API_BASE?: undefined;
          SGLANG_API_BASE?: undefined;
          VLLM_API_BASE?: undefined;
          LITELLM_API_BASE?: undefined;
          WHISPERASR_API_BASE?: undefined;
        };
        url?: undefined;
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        models?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
      }
    | {
        id: string;
        detail: string;
        tools: boolean;
        tokenless: boolean;
        url?: undefined;
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        env?: undefined;
        prediction?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
        hidden?: undefined;
      }
    | {
        id: string;
        tools: boolean;
        tokenless: boolean;
        hidden: boolean;
        detail: string;
        url?: undefined;
        bearerToken?: undefined;
        transcribe?: undefined;
        speech?: undefined;
        listModels?: undefined;
        imageGeneration?: undefined;
        responseFormat?: undefined;
        metadata?: undefined;
        aliases?: undefined;
        models?: undefined;
        env?: undefined;
        prediction?: undefined;
        logprobs?: undefined;
        topLogprobs?: undefined;
        limitations?: undefined;
        logitBias?: undefined;
        openaiCompatibility?: undefined;
        reasoningEfforts?: undefined;
        seed?: undefined;
        topP?: undefined;
        singleModel?: undefined;
        pullModel?: undefined;
      }
  )[];
  aliases: {
    agent: string;
    long: string;
    tiny: string;
    memory: string;
    classify: string;
    summarize: string;
    cast: string;
    ocr: string;
    think: string;
    intent: string;
  };
  pricings: {
    "github:o4-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:o4-mini-2025-04-16": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:gpt-4.1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:gpt-4.1-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:gpt-4.1-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:gpt-4.1-mini-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:gpt-4.1-nano": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:gpt-4.1-nano-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:gpt-4o": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "github:gpt-4o-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "github:gpt-4o-2024-11-20": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "github:o1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:o1-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "github:o3-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-image-1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:o4-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o4-mini-2025-04-16": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-4.1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-4.1-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-4.1-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-4.1-mini-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-4.1-nano": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-4.1-nano-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:gpt-4o": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4o-2024-11-20": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4o-2024-08-06": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4o-2024-05-13": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4o-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4o-mini-2024-07-18": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:o1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o1-2024-12-17": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o1-preview": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o1-preview-2024-09-12": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o1-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o1-mini-2024-09-12": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o3-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:o3-mini-2025-01-31": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "openai:text-embedding-3-small": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: any;
    };
    "openai:text-embedding-3-large": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: any;
    };
    "openai:ada v2": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: any;
    };
    "openai:gpt-4o-realtime-preview": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4o-realtime-preview-2024-10-01": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:chatgpt-4o-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4-turbo": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4-turbo-2024-04-09": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4-32k": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4-0125-preview": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4-1106-preview": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-4-vision-preview": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-3.5-turbo-0125": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-3.5-turbo-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-3.5-turbo-1106": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-3.5-turbo-0613": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-3.5-turbo": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-3.5-turbo-16k-0613": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:gpt-3.5-turbo-0301": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:davinci-002": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "openai:babbage-002": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-4.1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:gpt-4.1-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:gpt-4.1-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:gpt-4.1-mini-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:gpt-4.1-nano": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:gpt-4.1-nano-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:o1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:o1-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure:gpt-4o-2024-08-06": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-4o": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-4o-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-3.5-turbo-0301": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-3.5-turbo-0613": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-3.5-turbo-0613-16k": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-3.5-turbo-1106": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-3.5-turbo-0125": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-3.5-turbo-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-4": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure:gpt-4-32k": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless:gpt-4.1": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure_serverless:gpt-4.1-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure_serverless:gpt-4.1-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure_serverless:gpt-4.1-mini-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure_serverless:gpt-4.1-nano": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure_serverless:gpt-4.1-nano-2025-04-14": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "azure_serverless:gpt-4o": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless:gpt-4o-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless:gpt-4o-2024-05-13": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless:gpt-4o-2024-08-06": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless:gpt-3.5-turbo-11066": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless:gpt-4-turbo": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless:gpt-4-turbo-vision": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:meta-llama-3-405b-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:llama-3.2-90b-vision-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:llama-3.2-11b-vision-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:meta-llama-3.1-405b-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:meta-llama-3.1-70b-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:meta-llama-3.1-8b-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:meta-llama-3-8b-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:meta-llama-3-2-90b-vision-instruct": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:mistral-large": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:mistral-large-2407": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:mistral-small": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:mistral-nemo": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:mistral-3b": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:cohere command r+": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:cohere command r": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:ai21-jamba-1.5-large": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:ai21-jamba-1.5-mini": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:mistral-3b-2410": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_serverless_models:ministral-3b": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "azure_ai_inference:deepseek-v3": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "google:gemini-1.5-flash": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1.5-flash-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1.5-flash-002": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1.5-flash-8b": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1.5-flash-8b-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1.5-pro": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1.5-pro-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1.5-pro-002": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      tiers: {
        context_size: number;
        price_per_million_input_tokens: number;
        price_per_million_output_tokens: number;
      }[];
    };
    "google:gemini-1-pro": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "alibaba:qwen-max": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "alibaba:qwen-plus": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "alibaba:qwen-turbo": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "mistral:mistral-large-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "mistral:mistral-small-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "mistral:pixtral-large-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "mistral:codestral-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "mistral:mistral-nemo": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
    };
    "anthropic:claude-3-7-sonnet-20250219": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "anthropic:claude-3-7-sonnet-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "anthropic:claude-3-5-sonnet-20240620": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "anthropic:claude-3-5-sonnet-20241022": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "anthropic:claude-3-5-sonnet-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "anthropic:claude-3-5-haiku-20241022": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "anthropic:claude-3-5-haiku-latest": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
    "deepseek:deepseek-chat": {
      price_per_million_input_tokens: number;
      price_per_million_output_tokens: number;
      input_cache_token_rebate: number;
    };
  };
};
export default _default;
//# sourceMappingURL=llmsdata.d.ts.map
