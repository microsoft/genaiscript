As DeepSeek mentions, [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) and  [DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-V3) are advanced large language models (LLM), that have gained significant attention for its performance and cost-effectiveness. DeepSeek's innovations highlight the potential for achieving high-level AI performance with fewer resources, challenging existing industry norms and prompting discussions about the future direction of AI development.

These pages documents the various options to run DeepSeek LLMs.

## DeepSeek.com

[DeepSeek.com](https://deepseek.com) is a LLM provider that develops the DeepSeek models.

- [`deepseek` provider](/genaiscript/getting-started/configuration#deepseek)

## Azure AI Foundry

[Azure AI Foundry](https://ai.azure.com) provides token-based billing for DeepSeek R1 and DeepSeek V3 models. See [Announcement](https://techcommunity.microsoft.com/blog/machinelearningblog/announcing-deepseek-v3-on-azure-ai-foundry-and-github/4390438).

```js
script({
    model: "azure_ai_inference:deepseek-v3",
})
```

- [`azure_ai_inference` provider](/genaiscript/getting-started/configuration#azure_ai_inference)

## GitHub Marketplace Models

[GitHub Marketplace Models](https://github.com/marketplace/models) provides a free experience to experiement with DeepSeek R1 and DeepSeek V3 models.

```js
script({
    model: "github:deepSeek-v3",
})
```

- [`github` provider](/genaiscript/getting-started/configuration#github)

## And others!

This is by no means complete and there are many other providers that can run DeepSeek models.

- [Ollama](https://ollama.com/library/deepseek-v3) (if you're machine can handle it)
- [LM Studio](https://lmstudio.ai/models)
- ...