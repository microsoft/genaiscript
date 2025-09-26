import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../components/LLMProviderFeatures.astro";

The `anthropic_bedrock` provider accesses Anthropic models on Amazon Bedrock. You can find the model names in the [Anthropic model documentation](https://docs.anthropic.com/en/docs/about-claude/models#model-names).

```js "anthropic_bedrock:"
script({
  model:
    "anthropic_bedrock:anthropic.claude-3-sonnet-20240229-v1:0",
});
```

## Configuration

GenAIScript supports multiple ways to configure AWS credentials for Bedrock access:

### Required Environment Variables

- `AWS_REGION` - The AWS region where Bedrock is enabled (e.g., `us-east-1`, `us-west-2`)

### Authentication Options

Choose one of the following authentication methods:

<Tabs>
<TabItem label="Access Keys">
```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..." # Optional, for temporary credentials
```
</TabItem>

<TabItem label="AWS Profile">
```bash
export AWS_PROFILE="my-profile"
```
</TabItem>

<TabItem label="Bedrock API Key">
```bash
export AWS_BEARER_TOKEN_BEDROCK="your-bedrock-api-key"
```
</TabItem>
</Tabs>

### Optional Environment Variables

- `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION` - Override AWS region for small/fast models
- `DISABLE_PROMPT_CACHING` - Set to `1` to disable Anthropic prompt caching
- `ANTHROPIC_MODEL` - Override the default Anthropic model ID for Bedrock

### Setup Steps

<Steps>

1. **Enable Bedrock Access**

   Request access to Claude models in the [Amazon Bedrock console](https://console.aws.amazon.com/bedrock/) under "Model Access".

2. **Configure Credentials**

   Set up your AWS credentials using one of the methods above. GenAIScript follows the standard [AWS credential provider chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).

3. **Set Region**

   Configure the AWS region where you have Bedrock access:
   ```bash
   export AWS_REGION="us-east-1"
   ```

4. **Test Configuration**

   ```bash
   genaiscript configure anthropic_bedrock
   ```

</Steps>

<LLMProviderFeatures provider="anthropic_bedrock" />