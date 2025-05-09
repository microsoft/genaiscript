import { FileTree } from "@astrojs/starlight/components"
import { Steps } from "@astrojs/starlight/components"
import { Tabs, TabItem } from "@astrojs/starlight/components"
import { Image } from "astro:assets"
import { YouTube } from "astro-embed"
import LLMProviderFeatures from "../../../components/LLMProviderFeatures.astro"

import lmSrc from "../../../assets/vscode-language-models.png"
import lmAlt from "../../../assets/vscode-language-models.png.txt?raw"

import lmSelectSrc from "../../../assets/vscode-language-models-select.png"
import lmSelectAlt from "../../../assets/vscode-language-models-select.png.txt?raw"

import oaiModelsSrc from "../../../assets/openai-model-names.png"
import oaiModelsAlt from "../../../assets/openai-model-names.png.txt?raw"

import {
    AZURE_OPENAI_API_VERSION,
    AZURE_AI_INFERENCE_VERSION,
} from "../../../../../packages/core/src/constants"

You will need to configure the LLM connection and authorization secrets. You can use remote (like OpenAI, Azure, etc.) and local models (like Ollama, Jan, LMStudio, etc.) with GenAIScript.

## Model selection

The model used by the script is configured through the `model` field in the `script` function.
The model name is formatted as `provider:model-name`, where `provider` is the LLM provider
and the `model-name` is provider specific.

```js 'model: "openai:gpt-4o"'
script({
    model: "openai:gpt-4o",
})
```

### Large, small, vision models

You can also use the `small`, `large`, `vision` [model aliases](/genaiscript/reference/scripts/model-aliases) to use the default configured small, large and vision-enabled models.
Large models are typically in the OpenAI gpt-4 reasoning range and can be used for more complex tasks.
Small models are in the OpenAI gpt-4o-mini range, and are useful for quick and simple tasks.

```js 'model: "small"'
script({ model: "small" })
```

```js 'model: "large"'
script({ model: "large" })
```

The model aliases can also be overridden from the [cli run command](/genaiscript/reference/cli/run),
or environment variables or configuration file. [Learn more about model aliases](/genaiscript/reference/scripts/model-aliases).

```sh
genaiscript run ... --model largemodelid --small-model smallmodelid
```

or by adding the `GENAISCRIPT_MODEL_LARGE` and `GENAISCRIPT_MODEL_SMALL` environment variables.

```txt title=".env"
GENAISCRIPT_MODEL_LARGE="azure_serverless:..."
GENAISCRIPT_MODEL_SMALL="azure_serverless:..."
GENAISCRIPT_MODEL_VISION="azure_serverless:..."
```

You can also configure the default aliases for a given LLM provider by using the `provider` argument.
The default are documented in this page and printed to the console output.

```js
script({ provider: "openai" })
```

```sh
genaiscript run ... --provider openai
```

### Model aliases

In fact, you can define any alias for your model (only alphanumeric characters are allowed)
through environment variables of the name `GENAISCRIPT_MODEL_ALIAS`
where `ALIAS` is the alias you want to use.

```txt title=".env"
GENAISCRIPT_MODEL_TINY=...
```

Model aliases are always lowercased when used in the script.

```js
script({ model: "tiny" })
```

## `.env` file and `.env.genaiscript` file

GenAIScript uses a `.env` file (and `.env.genaiscript`) to load secrets and configuration information into the process environment variables.
GenAIScript multiple `.env` files to load configuration information.

<Steps>

<ol>

<li>

Create or update a `.gitignore` file in the root of your project and make it sure it includes `.env`.
This ensures that you do not accidentally commit your secrets to your source control.

```txt title=".gitignore" ".env"
...
.env
.env.genaiscript
```

</li>

<li>

Create a `.env` file in the root of your project.

<FileTree>

- .gitignore
- **.env**

</FileTree>

</li>

<li>

Update the `.env` file with the configuration information (see below).

</li>

</ol>

</Steps>

:::caution[Do Not Commit Secrets]

The `.env` file should never be commited to your source control!
If the `.gitignore` file is properly configured,
the `.env`, `.env.genaiscript` file will appear grayed out in Visual Studio Code.

```txt title=".gitignore" ".env"
...
.env
```

:::

### Custom .env file location

You can specify a custom `.env` file location through the CLI or an environment variable.

- GenAIScript script loads the following `.env` files in order by default:

    - `~/.env.genaiscript`
    - `./.env.genaiscript`
    - `./.env`

- by adding the `--env <...files>` argument to the CLI. Each `.env` file is imported in order and may override previous values.

```sh "--env .env .env.debug"
npx genaiscript ... --env .env .env.debug
```

- by setting the `GENAISCRIPT_ENV_FILE` environment variable.

```sh
GENAISCRIPT_ENV_FILE=".env.local" npx genaiscript ...
```

- by specifying the `.env` file location in a [configuration file](/genaiscript/reference/configuration-files).

```json title="~/genaiscript.config.yaml"
{
    "$schema": "https://microsoft.github.io/genaiscript/schemas/config.json",
    "envFile": [".env.local", ".env.another"]
}
```

### No .env file

If you do not want to use a `.env` file, make sure to populate the environment variables
of the genaiscript process with the configuration values.

Here are some common examples:

- Using bash syntax

```sh
OPENAI_API_KEY="value" npx --yes genaiscript run ...
```

- GitHub Action configuration

```yaml title=".github/workflows/genaiscript.yml"
run: npx --yes genaiscript run ...
env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## `configure` command

The [configure](/genaiscript/reference/cli/configure) command is an interactive command to configure and validate the LLM connections.

```sh
npx genaiscript configure
```

## OpenAI

`openai` is the OpenAI chat model provider.
It uses the `OPENAI_API_...` environment variables.

<Steps>

<ol>

<li>

[Upgrade your account](https://platform.openai.com/settings/organization/billing/overview) to get access to the models.
You will get 404s if you do not have a paying account.

</li>

<li>
    Create a new secret key from the [OpenAI API Keys
    portal](https://platform.openai.com/api-keys).
</li>

<li>

Update the `.env` file with the secret key.

```txt title=".env"
OPENAI_API_KEY=sk_...
```

</li>

<li>

Find the model you want to use
from the [OpenAI API Reference](https://platform.openai.com/docs/models/gpt-4o)
or the [OpenAI Chat Playground](https://platform.openai.com/playground/chat).

<Image src={oaiModelsSrc} alt={oaiModelsAlt} loading="lazy" />

</li>

<li>

Set the `model` field in `script` to the model you want to use.

```js 'model: "openai:gpt-4o"'
script({
    model: "openai:gpt-4o",
    ...
})
```

</li>

</ol>

</Steps>

:::tip[Default Model Configuration]

Use `GENAISCRIPT_MODEL_LARGE` and `GENAISCRIPT_MODEL_SMALL` in your `.env` file to set the default model and small model.

```txt
GENAISCRIPT_MODEL_LARGE=openai:gpt-4o
GENAISCRIPT_MODEL_SMALL=openai:gpt-4o-mini
```

:::

### Logging

You can enable the `genaiscript:openai` and `genaiscript:openai:msg` [logging namespaces](/genaiscript/reference/scripts/logging) for more information about the requests and responses:

<LLMProviderFeatures provider="openai" />

## GitHub Models <a id="github" href=""></a>

The [GitHub Models](https://github.com/marketplace/models) provider, `github`, allows running models through the GitHub Marketplace.
This provider is useful for prototyping and subject to [rate limits](https://docs.github.com/en/github-models/prototyping-with-ai-models#rate-limits)
depending on your subscription.

```js "github:"
script({ model: "github:gpt-4o" })
```

### Codespace configuration

If you are running from a [GitHub Codespace](https://github.com/features/codespaces), the token is already configured for you...
It just works.

### GitHub Actions configuration

As of [April 2025](https://github.blog/changelog/2025-04-14-github-actions-token-integration-now-generally-available-in-github-models/),
you can use the GitHub Actions token (`GITHUB_TOKEN`) to call AI models directly inside your workflows.

<Steps>

<ol>

<li>

Ensure that the `models` permission is enabled in your workflow configuration.

```yaml title="genai.yml" "models: read"
permissions:
    models: read
```

</li>

<li>

Pass the `GITHUB_TOKEN` when running `genaiscript`

```yaml title="genai.yml" "GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}"
run: npx -y genaiscript run ...
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

</li>

</ol>

</Steps>

Read more in the [GitHub Documentation](https://docs.github.com/en/github-models/integrating-ai-models-into-your-development-workflow#using-ai-models-with-github-actions)

### Configuring with your own token

If you are not using GitHub Actions or Codespaces, you can use your own token to access the models.

<Steps>

<ol>

<li>

Create a [GitHub personal access token](https://github.com/settings/tokens/new).
The token should not have any scopes or permissions.

</li>

<li>

Update the `.env` file with the token.

```txt title=".env"
GITHUB_TOKEN=...
```

</li>

</ol>

</Steps>

To configure a specific model,

<Steps>

<ol>

<li>

Open the [GitHub Marketplace](https://github.com/marketplace/models) and find the model you want to use.

</li>

<li>

Copy the model name from the Javascript/Python samples

```js "Phi-3-mini-4k-instruct"
const modelName = "Phi-3-mini-4k-instruct"
```

to configure your script.

```js "Phi-3-mini-4k-instruct"
script({
    model: "github:Phi-3-mini-4k-instruct",
})
```

</li>

</ol>

</Steps>

If you are already using `GITHUB_TOKEN` variable in your script and need a different one
for GitHub Models, you can use the `GITHUB_MODELS_TOKEN` variable instead.

### `o1-preview` and `o1-mini` models

Currently these models do not support streaming and
system prompts. GenAIScript handles this internally.

```js "github:o1-mini"
script({
    model: "github:o1-mini",
})
```

<LLMProviderFeatures provider="github" />

## Azure OpenAI <a id="azure" href=""></a>

The [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#chat-completions) provider, `azure` uses the `AZURE_OPENAI_...` environment variables.
You can use a managed identity (recommended) or an API key to authenticate with the Azure OpenAI service.
You can also use a service principal as documented in [automation](/genaiscript/getting-started/automating-scripts).

```js "azure:"
script({ model: "azure:deployment-id" })
```

:::tip

If you are a Visual Studio Subscriber, you can [get free Azure credits](https://azure.microsoft.com/en-us/pricing/member-offers/credit-for-visual-studio-subscribers/)
to try the Azure OpenAI service.

:::

### Managed Identity (Entra ID)

<Steps>

<ol>

<li>

Open your Azure OpenAI resource in the [Azure Portal](https://portal.azure.com)

</li>
<li>

Navigate to **Access Control (IAM)**, then **View My Access**. Make sure your
user or service principal has the **Cognitive Services OpenAI User/Contributor** role.
If you get a `401` error, click on **Add**, **Add role assignment** and add the **Cognitive Services OpenAI User** role to your user.

</li>
<li>
Navigate to **Resource Management**, then **Keys and Endpoint**.
</li>
<li>

Update the `.env` file with the endpoint.

```txt title=".env"
AZURE_OPENAI_API_ENDPOINT=https://....openai.azure.com
```

:::note

Make sure to remove any `AZURE_API_KEY`, `AZURE_OPENAI_API_KEY` entries from `.env` file.

:::

</li>

<li>

Navigate to **deployments** and make sure that you have your LLM deployed and copy the `deployment-id`, you will need it in the script.

</li>

<li>

Open a terminal and **login** with [Azure CLI](https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest#authenticate-via-the-azure-cli).

```sh
az login
```

</li>

<li>

Update the `model` field in the `script` function to match the model deployment name in your Azure resource.

```js 'model: "azure:deployment-id"'
script({
    model: "azure:deployment-id",
    ...
})
```

</li>

</ol>

</Steps>

Set the `NODE_ENV` environment variable to `development` to enable the `DefaultAzureCredential` to work with the Azure CLI.
Otherwise, it will use a chained token credential with `env`, `workload`, `managed identity`, `azure cli`, `azure dev cli`, `azure powershell`, `devicecode` credentials.

### Listing models

There are two ways to list the models in your Azure OpenAI resource: use the Azure Management APIs
or by calling into a custom `/models` endpoint.

### Using the management APIs (this is the common way)

In order to allow GenAIScript to list deployments in your Azure OpenAI service,
you need to provide the Subscription ID **and you need to use Microsoft Entra!**.

<Steps>

<ol>

<li>

Open the Azure OpenAI resource in the [Azure Portal](https://portal.azure.com), open the **Overview** tab and copy the **Subscription ID**.

</li>

<li>

Update the `.env` file with the subscription id.

```txt title=".env"
AZURE_OPENAI_SUBSCRIPTION_ID="..."
```

</li>

<li>

Test your configuration by running

```sh
npx genaiscript models azure
```

:::note

This feature will probably not work with `AZURE_OPENAI_API_KEY`
as the token does not have the proper scope to query the list of deployments.

:::

</li>

</ol>

</Steps>

#### Using the `/models` endpoint

This approach assumes you have set a OpenAI comptaible `/models` enpoint in your subscription
that returns the list of deployments in a format compatible with the OpenAI API.

You can set the `AZURE_OPENAI_API_MODELS_TYPE` environment variable to point to `openai`.

```txt title=".env"
AZURE_OPENAI_API_MODELS_TYPE="openai"
```

### Custom credentials

In some situations, the default credentials chain lookup may not work.
In that case, you can specify an additional environment variable `AZURE_OPENAI_API_CREDENTIALS`
with the type of credential that should be used.

```txt title=".env"
AZURE_OPENAI_API_CREDENTIALS=cli
```

The types are mapped directly to their [@azure/identity](https://www.npmjs.com/package/@azure/identity) credential types:

- `cli` - `AzureCliCredential`
- `env` - `EnvironmentCredential`
- `powershell` - `AzurePowerShellCredential`
- `devcli` - `AzureDeveloperCliCredential`
- `workloadidentity` - `WorkloadIdentityCredential`
- `managedidentity` - `ManagedIdentityCredential`

Set `NODE_ENV` to `development` to use the `DefaultAzureCredential` with the GenAIScript.

### Custom token scopes

The default token scope for Azure OpenAI access is `https://cognitiveservices.azure.com/.default`.
You can override this value using the `AZURE_OPENAI_TOKEN_SCOPES` environment variable.

```txt title=".env"
AZURE_OPENAI_TOKEN_SCOPES=...
```

### API Version

GenAIScript maintains a [default API version](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation) to access Azure OpenAI.

- current version: {AZURE_OPENAI_API_VERSION}

You can override this value using the `AZURE_OPENAI_API_VERSION` environment variable.

```txt title=".env"
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

You can also override the API version on a per-deployment basis by settings the `AZURE_OPENAI_API_VERSION_<deployment-id>` environment variable (where deployment-id is capitalized).

```txt title=".env"
AZURE_OPENAI_API_VERSION_GPT-4O=2025-01-01-preview
```

### API Key

<Steps>

<ol>

<li>

Open your [Azure OpenAI resource](https://portal.azure.com) and navigate to **Resource Management**, then **Keys and Endpoint**.

</li>

<li>

Update the `.env` file with the secret key (**Key 1** or **Key 2**) and the endpoint.

```txt title=".env"
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_ENDPOINT=https://....openai.azure.com
```

</li>

<li>

The rest of the steps are the same: Find the deployment name and use it in your script, `model: "azure:deployment-id"`.

</li>

</ol>

</Steps>

<LLMProviderFeatures provider="azure" />

## Azure AI Foundry <a id="azure_serverless" href=""></a>

Azure AI Foundry provides access to serverless and deployed models, both for OpenAI and other providers. There are multiple ways to access those servers
that are supported in GenAIScript:

- without any deployment, using the [Azure AI Model Inference](#azure_ai_inference) provider,
- with deployment for OpenAI models, using the [Azure AI OpenAI Serverless](#azure_serverless) provider,
- with deployments for non-OpenAI models, use the [Azure AI Serverless Models](#azure_serverless_models) provider.

You can deploy "serverless" models through [Azure AI Foundry](https://ai.azure.com/) and pay as you go per token.
You can browse the [Azure AI Foundry model catalog](https://ai.azure.com/explore/models)
and use the [serverless API](https://learn.microsoft.com/en-us/azure/ai-studio/how-to/deploy-models-serverless-availability) filter to see the available models.

There are two types of serverless deployments that require different configurations: OpenAI models and all other models.
The OpenAI models, like `gpt-4o`, are deployed to `.openai.azure.com` endpoints,
while the Azure AI models, like `Meta-Llama-3.1-405B-Instruct` are deployed to `.models.ai.azure.com` endpoints.

They are configured slightly differently.

### Azure AI Inference <a href="" id="azure_ai_inference" />

The [Azure AI Model Inference API](https://learn.microsoft.com/en-us/azure/ai-foundry/model-inference/reference/reference-model-inference-api?tabs=javascript)
provides a single endpoint to access a number of LLMs. This is a great way to experiment as you do not need to create deployments to access models.
It supports both Entra ID and key-based authentication.

```js "azure_ai_inference:gpt-4o"
script({ model: "azure_ai_inference:gpt-4o" })
```

<YouTube
    id="https://www.youtube.com/watch?v=kh670Bxe_1E"
    posterQuality="high"
/>

#### Managed Identity (Entra ID)

<Steps>

<ol>

<li>

**Follow [these steps](https://learn.microsoft.com/en-us/azure/ai-foundry/model-inference/how-to/configure-entra-id?tabs=rest&pivots=ai-foundry-portal)
carefully** to configure the required Roles for your user.

</li>

<li>

Open https://ai.azure.com/ and open your project

</li>

<li>

Configure the **Endpoint Target URL** as the `AZURE_AI_INFERENCE_API_ENDPOINT`.

```txt title=".env"
AZURE_AI_INFERENCE_API_ENDPOINT=https://<resource-name>.services.ai.azure.com/models
```

</li>

<li>

Find the model name in the model catalog with the **Deployment options = Serverless API** filter and use it in your script,
`model: "azure_id_inference:model-id"`.

```js
script({ model: "azure_ai_inference:model-id" })
```

</li>

</ol>

</Steps>

#### API Key

<Steps>

<ol>

<li>

Open https://ai.azure.com/, open your project and go the **Overview** page.

</li>

<li>

Configure the **Endpoint Target URL** as the `AZURE_AI_INFERENCE_API_ENDPOINT` variable and the key in
`AZURE_AI_INFERENCE_API_KEY` in the `.env` file\***\*.\*\***

```txt title=".env"
AZURE_AI_INFERENCE_API_ENDPOINT=https://<resourcename>.services.ai.azure.com/models
AZURE_AI_INFERENCE_API_KEY=...
```

</li>

<li>

Find the model name in the model catalog with the **Deployment options = Serverless API** filter and use it in your script,
`model: "azure_id_inference:model-id"`.

```js
script({ model: "azure_ai_inference:model-id" })
```

</li>

</ol>

</Steps>

#### API Version

The default API version for Azure AI Inference is {AZURE_AI_INFERENCE_VERSION}.
You can change it by setting the `AZURE_AI_INFERENCE_API_VERSION` environment variable
(see [Azure AI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation))

```txt title=".env"
AZURE_AI_INFERENCE_API_VERSION=2025-01-01-preview
```

<LLMProviderFeatures provider="azure_ai_inference" />

### Azure AI OpenAI Serverless <a href="" id="azure_serverless" />

The `azure_serverless` provider supports OpenAI models deployed through the Azure AI Foundry serverless deployments.
It supports both Entra ID and key-based authentication.

```js "azure_serverless:"
script({ model: "azure_serverless:deployment-id" })
```

:::note

This kind of deployment is different from the **Azure OpenAI** deployments (`azure` provider).

:::

#### Managed Identity (Entra ID)

<Steps>

<ol>

<li>

Open https://ai.azure.com/, open your project and go the **Deployments** page.

</li>

<li>

Deploy a **base model** from the catalog.
You can use the `Deployment Options` -> `Serverless API` option to deploy a model as a serverless API.

</li>

<li>

Deploy an OpenAI base model.
This will also create a new Azure OpenAI resource in your subscription (which may be invisible to you, more later).

</li>

<li>

Update the `.env` file with the deployment endpoint in the `AZURE_SERVERLESS_OPENAI_API_ENDPOINT` variable.

```txt title=".env"
AZURE_SERVERLESS_OPENAI_API_ENDPOINT=https://....openai.azure.com
```

</li>

<li>

Go back to the **Overview** tab in your Azure AI Foundry project and
click on **Open in Management center**.

</li>

<li>

Click on the **Azure OpenAI Service** resource, then click on the **Resource** external link which will take you back to the (underlying) Azure OpenAI service
in Azure Portal.

</li>

<li>

Navigate to **Access Control (IAM)**, then **View My Access**. Make sure your
user or service principal has the **Cognitive Services OpenAI User/Contributor** role.
If you get a `401` error, click on **Add**, **Add role assignment** and add the **Cognitive Services OpenAI User** role to your user.

</li>

</ol>

</Steps>

At this point, you are ready to login with the Azure CLI and use the managed identity.

:::note

The resources created by Azure AI Foundry are not visible by default in the Azure Portal.
To make them visible, open [All resources](https://portal.azure.com/#browse/all), click **Manage view**
and select **Show hidden types**.

:::

<Steps>

<ol>

<li>

Install the [Azure CLI](https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest#authenticate-via-the-azure-cli).

</li>

<li>

Open a terminal and login

```sh
az login
```

</li>

</ol>

</Steps>

#### API Key

<Steps>

<ol>

<li>

Open your [Azure OpenAI resource](https://portal.azure.com) and navigate to **Resource Management**, then **Keys and Endpoint**.

</li>

<li>

Update the `.env` file with the endpoint and the secret key (**Key 1** or **Key 2**) and the endpoint.

```txt title=".env"
AZURE_SERVERLESS_OPENAI_API_ENDPOINT=https://....openai.azure.com
AZURE_SERVERLESS_OPENAI_API_KEY=...
```

</li>

</ol>

</Steps>

<LLMProviderFeatures provider="azure_serverless" />

### Azure AI Serverless Models <a href="" id="azure_serverless_models" />

The `azure_serverless_models` provider supports non-OpenAI models, such as DeepSeek R1/v3, deployed through the Azure AI Foundary serverless deployments.

```js "azure_serverless_models:"
script({ model: "azure_serverless_models:deployment-id" })
```

#### Managed Identity (Entra ID)

<Steps>

<ol>

<li>

Open your **Azure AI Project** resource in the [Azure Portal](https://portal.azure.com)

</li>
<li>

Navigate to **Access Control (IAM)**, then **View My Access**. Make sure your
user or service principal has the **Azure AI Developer** role.
If you get a `401` error, click on **Add**, **Add role assignment** and add the **Azure AI Developer** role to your user.

</li>

<li>

Configure the **Endpoint Target URL** as the `AZURE_SERVERLESS_MODELS_API_ENDPOINT`.

```txt title=".env"
AZURE_SERVERLESS_MODELS_API_ENDPOINT=https://...models.ai.azure.com
```

</li>

<li>

Navigate to **deployments** and make sure that you have your LLM deployed and copy the Deployment Info name, you will need it in the script.

</li>

<li>

Update the `model` field in the `script` function to match the model deployment name in your Azure resource.

```js 'model: "azure_serverless:deployment-info-name"'
script({
    model: "azure_serverless:deployment-info-name",
    ...
})
```

</li>

</ol>

</Steps>

#### API Key

<Steps>

<ol>

<li>

Open https://ai.azure.com/ and open the **Deployments** page.

</li>

<li>

Deploy a **base model** from the catalog.
You can use the `Deployment Options` -> `Serverless API` option to deploy a model as a serverless API.

</li>

<li>

Configure the **Endpoint Target URL** as the `AZURE_SERVERLESS_MODELS_API_ENDPOINT` variable and the key in
`AZURE_SERVERLESS_MODELS_API_KEY` in the `.env` file\***\*.\*\***

```txt title=".env"
AZURE_SERVERLESS_MODELS_API_ENDPOINT=https://...models.ai.azure.com
AZURE_SERVERLESS_MODELS_API_KEY=...
```

</li>

<li>

Find the deployment name and use it in your script, `model: "azure_serverless_models:deployment-id"`.

</li>

</ol>

</Steps>

#### Support for multiple inference deployments

You can update the `AZURE_SERVERLESS_MODELS_API_KEY` with a list of `deploymentid=key` pairs to support multiple deployments (each deployment has a different key).

```txt title=".env"
AZURE_SERVERLESS_MODELS_API_KEY="
model1=key1
model2=key2
model3=key3
"
```

<LLMProviderFeatures provider="azure_serverless_models" />

## Azure AI Search

This is not a LLM provider, but a content search provider. However since it is configured similarly to the other Azure services,
it is included here. It allows you to do [vector search](/genaiscript/reference/scripts/vector-search) of your documents
using [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search).

```js "azure_search:"
const index = await retrieval.index("animals", { type: "azure_ai_search" })
await index.insertOrUpdate(env.files)
const docs = await index.search("cat dog")
```

### Managed Identity (Entra ID)

The service is configured through the `AZURE_AI_SEARCH_ENDPOINT` environment variable
and the [configuration of the managed identity](https://learn.microsoft.com/en-us/azure/search/search-security-rbac?tabs=roles-portal-admin%2Croles-portal%2Croles-portal-query%2Ctest-portal%2Ccustom-role-portal).

```txt
AZURE_AI_SEARCH_ENDPOINT=https://{{service-name}}.search.windows.net/
```

<Steps>

<ol>

<li>

Open your **Azure AI Search** resource in the [Azure Portal](https://portal.azure.com),
click on **Overview** and click on **Properties**.

</li>

<li>

Click on **API Access control** and enable **Role-based access control** or **Both**.

</li>

<li>

Open the **Access Control (IAM)** tab and make sure your user
or service principal has the **Search Service Contributor** role.

</li>

</ol>

</Steps>

### API Key

The service is configured through the `AZURE_AI_SEARCH_ENDPOINT` and `AZURE_AI_SEARCH_API_KEY` environment variables.

```txt
AZURE_AI_SEARCH_ENDPOINT=https://{{service-name}}.search.windows.net/
AZURE_AI_SEARCH_API_KEY=...
```

## Google AI <a href="" id="google" />

The `google` provider allows you to use Google AI models. It gives you access

:::note

GenAIScript uses the [OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai) layer of Google AI,
so some [limitations](https://ai.google.dev/gemini-api/docs/openai#current-limitations) apply.

- `seed` is not supported and ignored.
- [fallback tools](/genaiscript/reference/scripts/tools#fallbacktools) are enabled
  using Google finishes the OpenAI compatibilty layer. (See [forum](https://discuss.ai.google.dev/t/gemini-openai-compatibility-multiple-functions-support-in-function-calling-error-400/49431)).

:::

<Steps>

<ol>

<li>

Open [Google AI Studio](https://aistudio.google.com/app/apikey) and create a new API key.

</li>

<li>

Update the `.env` file with the API key.

```txt title=".env"
GEMINI_API_KEY=...
```

</li>

<li>

Find the model identifier in the [Gemini documentation](https://ai.google.dev/gemini-api/docs/models/gemini)
and use it in your script or cli with the `google` provider.

```py "gemini-1.5-pro-002"
...
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
});
...
```

then use the model identifier in your script.

```js "gemini-1.5-pro-latest"
script({ model: "google:gemini-1.5-pro-latest" })
```

</li>

</ol>

</Steps>

<LLMProviderFeatures provider="google" />

## GitHub Copilot Chat Models <a id="github_copilot_chat" href=""></a>

If you have access to **GitHub Copilot Chat in Visual Studio Code**,
GenAIScript will be able to leverage those [language models](https://code.visualstudio.com/api/extension-guides/language-model) as well.

This mode is useful to run your scripts without having a separate LLM provider or local LLMs. However, those models are not available from the command line
and have additional limitations and rate limiting defined by the GitHub Copilot platform.

There is no configuration needed as long as you have GitHub Copilot installed and configured in Visual Studio Code.

You can force using this model by using `github_copilot_chat:*` as a model name
or set the **GenAIScript > Language Chat Models Provider** setting to true.
This will default GenAIScript to use this provider for model aliases.

<YouTube id="LRrVMiZgWJg" posterQuality="high" />

<Steps>

<ol>

<li>

Install [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) (emphasis on **Chat**)

</li>

<li>run your script</li>
<li>

Confirm that you are allowing GenAIScript to use the GitHub Copilot Chat models.

</li>
<li>
select the best chat model that matches the one you have in your script

<Image src={lmSelectSrc} alt={lmSelectAlt} loading="lazy" />

(This step is skipped if you already have mappings in your settings)

</li>

</ol>

</Steps>

The mapping of GenAIScript model names to Visual Studio Models is stored in the settings.

## Anthropic

The `anthropic` provider access [Anthropic](https://www.anthropic.com/) models. Anthropic is an AI research company that offers powerful language models, including the Claude series.

```js "anthropic:"
script({ model: "anthropic:claude-2.1" })
```

To use Anthropic models with GenAIScript, follow these steps:

<Steps>

<ol>

<li>

Sign up for an Anthropic account and obtain an API key from their [console](https://console.anthropic.com/).

</li>

<li>

Add your Anthropic API key to the `.env` file:

```txt title=".env"
ANTHROPIC_API_KEY=sk-ant-api...
```

</li>

<li>

Find the model that best suits your needs by visiting the [Anthropic model documentation](https://docs.anthropic.com/en/docs/about-claude/models#model-names).

</li>

<li>

Update your script to use the `model` you choose.

```js
script({
    ...
    model: "anthropic:claude-3-5-sonnet-20240620",
})
```

</li>

</ol>

</Steps>

<LLMProviderFeatures provider="anthropic" />

### Anthropic Bedrock <a href="" id="anthropic_bedrock" />

The `anthropic_bedrock` provider accesses Anthropic models on Amazon Bedrock. You can find the model names in the [Anthropic model documentation](https://docs.anthropic.com/en/docs/about-claude/models#model-names).

GenAIScript assumes that you have configured AWS credentials in a way that the [AWS Node SDK will recognise](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).

```js "anthropic_bedrock:"
script({ model: "anthropic_bedrock:anthropic.claude-3-sonnet-20240229-v1:0" })
```

## Hugging Face <a href="" id="huggingface" />

The `huggingface` provider allows you to use [Hugging Face Models](https://huggingface.co/models?other=text-generation-inference) using [Text Generation Inference](https://huggingface.co/docs/text-generation-inference/index).

```js "huggingface:"
script({ model: "huggingface:microsoft/Phi-3-mini-4k-instruct" })
```

To use Hugging Face models with GenAIScript, follow these steps:

<Steps>

<ol>

<li>

Sign up for a [Hugging Face account](https://huggingface.co/) and obtain an API key from their [console](https://huggingface.co/settings/tokens).
If you are creating a **Fined Grained** token, enable the **Make calls to the serverless inference API** option.

</li>

<li>

Add your Hugging Face API key to the `.env` file
as `HUGGINGFACE_API_KEY`, `HF_TOKEN` or `HUGGINGFACE_TOKEN` variables.

```txt title=".env"
HUGGINGFACE_API_KEY=hf_...
```

</li>

<li>

Find the model that best suits your needs by visiting the [HuggingFace models](https://huggingface.co/models?other=text-generation-inference).

</li>

<li>

Update your script to use the `model` you choose.

```js
script({
    ...
    model: "huggingface:microsoft/Phi-3-mini-4k-instruct",
})
```

</li>

</ol>

</Steps>

:::note

Some models may require a Pro account.

:::

### Logging

You can enable the `genaiscript:anthropic` and `genaiscript:anthropic:msg` [logging namespaces](/genaiscript/reference/scripts/logging) for more information about the requests and responses:

<LLMProviderFeatures provider="huggingface" />

## Mistral AI <a href="" id="mistral" />

The `mistral` provider allows you to use [Mistral AI Models](https://mistral.ai/technology/#models)
using the [Mistral API](https://docs.mistral.ai/).

```js "mistral:"
script({ model: "mistral:mistral-large-latest" })
```

<Steps>

<ol>

<li>

Sign up for a [Mistral AI account](https://mistral.ai/)
and obtain an API key from their [console](https://console.mistral.ai/).

</li>

<li>

Add your Mistral AI API key to the `.env` file:

```txt title=".env"
MISTRAL_API_KEY=...
```

</li>

<li>

Update your script to use the `model` you choose.

```js
script({
    ...
    model: "mistral:mistral-large-latest",
})
```

</li>

</ol>

</Steps>

<LLMProviderFeatures provider="mistral" />

## Alibaba Cloud <a href="" id="alibaba" />

The `alibaba` provider access the [Alibaba Cloud](https://www.alibabacloud.com/) models.

```js "alibaba:"
script({
    model: "alibaba:qwen-max",
})
```

<Steps>

<ol>

<li>

Sign up for a [Alibaba Cloud account](https://www.alibabacloud.com/help/en/model-studio/developer-reference/get-api-key) and obtain an API key from their [console](https://bailian.console.alibabacloud.com/).

</li>

<li>

Add your Alibaba API key to the `.env` file:

```txt title=".env"
ALIBABA_API_KEY=sk_...
```

</li>

<li>

Find the model that best suits your needs by visiting the [Alibaba models](https://www.alibabacloud.com/help/en/model-studio/developer-reference/use-qwen-by-calling-api).

</li>

<li>

Update your script to use the `model` you choose.

```js
script({
    ...
    model: "alibaba:qwen-max",
})
```

</li>

</ol>

</Steps>

<LLMProviderFeatures provider="alibaba" />

## Ollama

[Ollama](https://ollama.ai/) is a desktop application that lets you download and run models locally.

Running tools locally may require additional GPU resources depending on the model you are using.

Use the `ollama` provider to access Ollama models.

:::note

GenAIScript is currently using the OpenAI API compatibility layer of Ollama.

:::

<Steps>

<ol>

<li>

Start the Ollama application or

```sh
ollama serve
```

</li>

<li>

Update your script to use the `ollama:phi3.5` model (or any [other model](https://ollama.com/library) or from [Hugging Face](https://huggingface.co/docs/hub/en/ollama)).

```js "ollama:phi3.5"
script({
    ...,
    model: "ollama:phi3.5",
})
```

GenAIScript will automatically pull the model, which may take some time depending on the model size. The model is cached locally by Ollama.

</li>

<li>

If Ollama runs on a server or a different computer or on a different port,
you have to configure the `OLLAMA_HOST` environment variable to connect to a remote Ollama server.

```txt title=".env"
OLLAMA_HOST=https://<IP or domain>:<port>/ # server url
OLLAMA_HOST=0.0.0.0:12345 # different port
```

</li>

</ol>

</Steps>

You can specify the model size by adding the size to the model name, like `ollama:llama3.2:3b`.

```js "ollama:llama3.2:3b"
script({
    ...,
    model: "ollama:llama3.2:3b",
})
```

### Ollama with Hugging Face models

You can also use [GGUF models](https://huggingface.co/models?library=gguf) from [Hugging Face](https://huggingface.co/docs/hub/en/ollama).

```js "hf.co/bartowski/Llama-3.2-1B-Instruct-GGUF"
script({
    ...,
    model: "ollama:hf.co/bartowski/Llama-3.2-1B-Instruct-GGUF",
})
```

### Ollama with Docker

You can conviniately run Ollama in a Docker container.

- if you are using a [devcontainer](https://code.visualstudio.com/devcontainers)
  or a [GitHub Codespace](https://github.com/features/codespaces),
  make sure to add the `docker-in-docker` option to your `devcontainer.json` file.

```json
{
    "features": {
        "docker-in-docker": "latest"
    }
}
```

- start the [Ollama container](https://ollama.com/blog/ollama-is-now-available-as-an-official-docker-image)

```sh wrap
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

- stop and remove the Ollama containers

```sh wrap
docker stop ollama && docker rm ollama
```

:::tip

Add these scripts to your `package.json` file to make it easier to start and stop the Ollama container.

```json
{
    "scripts": {
        "ollama:start": "docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama",
        "ollama:stop": "docker stop ollama && docker rm ollama"
    }
}
```

:::

<LLMProviderFeatures provider="ollama" />

## DeepSeek

`deepseek` is the [DeepSeek (https://www.deepseek.com/)](https://www.deepseek.com/) chat model provider.
It uses the `DEEPSEEK_API_...` environment variables.

<Steps>

<ol>

<li>
    Create a new secret key from the [DeepSeek API Keys
    portal](https://platform.deepseek.com/usage).
</li>

<li>

Update the `.env` file with the secret key.

```txt title=".env"
DEEPSEEK_API_KEY=sk_...
```

</li>

<li>

Set the `model` field in `script` to `deepseek:deepseek:deepseek-chat` which is currently the only supported model.

```js 'model: "deepseek:deepseek-chat"'
script({
    model: "deepseek:deepseek-chat",
    ...
})
```

</li>

</ol>

</Steps>

<LLMProviderFeatures provider="deepseek" />

## LM Studio <a href="" id="lmstudio" />

The `lmstudio` provider connects to the [LMStudio](https://lmstudio.ai/) headless server.
and allows to run local LLMs.

<Steps>

<ol>

<li>

Install [LMStudio](https://lmstudio.ai/download) (v0.3.5+)

</li>

<li>

Open LMStudio

</li>

<li>

Open the [Model Catalog](https://lmstudio.ai/models),
select your model and load it at least once so it is downloaded locally.

</li>

<li>

Open the settings (Gearwheel icon) and enable **Enable Local LLM Service**.

</li>

<li>

GenAIScript assumes the local server is at `http://localhost:1234/v1` by default.
Add a `LMSTUDIO_API_BASE` environment variable to change the server URL.

```txt title=".env"
LMSTUDIO_API_BASE=http://localhost:2345/v1
```

</li>

</ol>

</Steps>

Find the model **API identifier** in the dialog of loaded models then use that identifier in your script:

```js '"lmstudio:llama-3.2-1b"'
script({
    model: "lmstudio:llama-3.2-1b-instruct",
})
```

- GenAIScript uses the [LMStudio CLI](https://lmstudio.ai/docs/cli)
  to pull models on demand.
- Specifiying the quantization is currently not supported.

<LLMProviderFeatures provider="lmstudio" />

### LM Studio and Hugging Face Models

Follow [this guide](https://huggingface.co/blog/yagilb/lms-hf) to load Hugging Face models into LMStudio.

## Jan

The `jan` provider connects to the [Jan](https://jan.ai/) local server.

<Steps>

<ol>

<li>

[Jan](https://jan.ai/)

</li>

<li>

Open Jan and download the models you plan to use. You will find the model
identifier in the model description page.

</li>

<li>

Click on the **Local API Server** icon (lower left), then **Start Server**.

Keep the desktop application running!

</li>

</ol>

</Steps>

To use Jan models, use the `jan:modelid` syntax.
If you change the default server URL, you can set the `JAN_API_BASE` environment variable.

```txt title=".env"
JAN_API_BASE=http://localhost:1234/v1
```

<LLMProviderFeatures provider="jan" />

## Windows AI

The `window_ai` provider support [AI for Windows Apps](https://learn.microsoft.com/en-us/windows/ai/) which provides state-of-the-art local models, with NPU hardware support.

<Steps>

<ol>
<li>

Install the [AI Toolkit for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ms-windows-ai-studio.windows-ai-studio)
extension.

</li>

<li>

Open the **Model Catalog** and add a model from the **ONNX Models** runtime section.

</li>

<li>

Right click on the model in the Explorer view and select **Copy model name**

</li>

<li>

Set the model name in your script to the model name you copied.

```js "windows_ai:"
script({
    model: "windows_ai:Phi-4-mini-gpu-int4-rtn-block-32",
})
```

</li>

</ol>

</Steps>

See [Azure AI Toolkit getting started guide](https://learn.microsoft.com/en-us/windows/ai/toolkit/toolkit-getting-started).

## LocalAI

[LocalAI](https://localai.io/) act as a drop-in replacement REST API that’s compatible
with OpenAI API specifications for local inferencing. It uses free Open Source models
and it runs on CPUs.

LocalAI acts as an OpenAI replacement, you can see the [model name mapping](https://localai.io/basics/container/#all-in-one-images)
used in the container, like `gpt-4` is mapped to `phi-2`.

<Steps>

<ol>

<li>

Install Docker. See the [LocalAI documentation](https://localai.io/basics/getting_started/#prerequisites) for more information.

</li>

<li>

Update the `.env` file and set the api type to `localai`.

```txt title=".env" "localai"
OPENAI_API_TYPE=localai
```

</li>

</ol>

</Steps>

To start LocalAI in docker, run the following command:

```sh
docker run -p 8080:8080 --name local-ai -ti localai/localai:latest-aio-cpu
docker start local-ai
docker stats
echo "LocalAI is running at http://127.0.0.1:8080"
```

## Llamafile

[https://llamafile.ai/](https://llamafile.ai/) is a single file desktop application
that allows you to run an LLM locally.

The provider is `llamafile` and the model name is ignored.

## SGLang

[SGLang](https://docs.sglang.ai/) is a fast serving framework for large language models and vision language models.

The provider is `sglang` and the model name is ignored.

## vLLM

[vLLM](https://docs.vllm.ai/) is a fast and easy-to-use library for LLM inference and serving.

The provider is `vllm` and the model name is ignored.

## LLaMA.cpp

[LLaMA.cpp](https://github.com/ggerganov/llama.cpp/tree/master/examples/server)
also allow running models locally or interfacing with other LLM vendors.

<Steps>

<ol>

<li>

Update the `.env` file with the local server information.

```txt title=".env"
OPENAI_API_BASE=http://localhost:...
```

</li>

</ol>

</Steps>

## OpenRouter

You can configure the OpenAI provider to use the [OpenRouter](https://openrouter.ai/docs/quick-start) service instead
by setting the `OPENAI_API_BASE` to `https://openrouter.ai/api/v1`.
You will also need an [api key](https://openrouter.ai/settings/keys).

```txt title=".env"
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_API_KEY=...
```

Then use the OpenRouter model name in your script:

```js
script({ model: "openai:openai/gpt-4o-mini" })
```

By default, GenAIScript will set the site URL and name to `GenAIScript` but you can override these settings with your own values:

```txt title=".env"
OPENROUTER_SITE_URL=... # populates HTTP-Referer header
OPENROUTER_SITE_NAME=... # populate X-Title header
```

## LiteLLM

The [LiteLLM](https://docs.litellm.ai/) proxy gateway provides a OpenAI compatible API for running models locally.
Configure the `LITELLM_...` keys to set the key and optionally the base url.

```txt title=".env"
LITELLM_API_KEY="..."
#LITELLM_API_BASE="..."
```

## Hugging Face Transformer.js <a href="" id="transformers" />

This `transformers` provider runs models on device using [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js/index).

The model syntax is `transformers:<repo>:<dtype>` where

- `repo` is the model repository on Hugging Face,
- [`dtype`](https://huggingface.co/docs/transformers.js/guides/dtypes) is the quantization type.

```js "transformers:"
script({
    model: "transformers:onnx-community/Qwen2.5-Coder-0.5B-Instruct:q4",
})
```

The default transformers device is `cpu`,
but you can changing it using `HUGGINGFACE_TRANSFORMERS_DEVICE` environment variable.

```txt title=".env"
HUGGINGFACE_TRANSFORMERS_DEVICE=gpu
```

:::note

This provider is experimental and may not work with all models.

:::

<LLMProviderFeatures provider="transformers" />

## Whisper ASR WebServices <a href="" id="whisperasr"></a>

This `whisperasr` provider allows to configure a [transcription](/genaiscript/reference/scripts/transcription)
task to use the [Whisper ASR WebService project](https://ahmetoner.com/whisper-asr-webservice/).

```js 'model: "whisperasr:default"'
const transcript = await transcribe("video.mp4", {
    model: "whisperasr:default",
})
```

This whisper service can run locally or in a docker container (see [documentation](https://ahmetoner.com/whisper-asr-webservice/)).

```sh title="CPU"
docker run -d -p 9000:9000 -e ASR_MODEL=base -e ASR_ENGINE=openai_whisper onerahmet/openai-whisper-asr-webservice:latest
```

You can also override the `transcription` model alias to change the default model used by `transcribe`.

## Echo

The `echo` provider is a dry run LLM provider that returns the messages without calling any LLM.
It is most useful for debugging when you want to see the result LLM request without sending it.

```js 'model: "echo"'
script({
    model: "echo",
})
```

Echo replies with the chat messages as markdown and JSON, which can be helpful for debugging.

## None

The `none` provider prevents the execution of LLM. It is typically used on a top-level script that exclusively uses inline prompts.

```js 'model: "none"'
script({
    model: "none",
})
```

## Custom Provider (OpenAI compatible)

You can use a custom provider that is compatible with the [OpenAI text generation API](https://platform.openai.com/docs/guides/text-generation).
This is useful for running LLMs on a local server or a different cloud provider.

For example, to define a `ollizard` provider, you need to set the `OLLIARD_API_BASE` environment variable to the custom provider URL,
and `OLLIZARD_API_KEY` if needed.

```txt title=".env"
OLLIZARD_API_BASE=http://localhost:1234/v1
#OLLIZARD_API_KEY=...
```

Then you can use this provider like any other provider.

```js 'model: "ollizard'
script({
    model: "ollizard:llama3.2:1b",
})
```

## Model specific environment variables

You can provide different environment variables
for each named model by using the `PROVIDER_MODEL_API_...` prefix or `PROVIDER_API_...` prefix.
The model name is capitalized and
all non-alphanumeric characters are converted to `_`.

This allows to have various sources of LLM computations
for different models. For example, to enable the `ollama:phi3`
model running locally, while keeping the default `openai` model connection information.

```txt title=".env"
OLLAMA_PHI3_API_BASE=http://localhost:11434/v1
```

## Running behind a proxy

You can set the `HTTP_PROXY` and/or `HTTPS_PROXY` environment variables to run GenAIScript behind a proxy.

```txt title=".env"
HTTP_PROXY=http://proxy.example.com:8080
```

## Checking your configuration

You can check your configuration by running the `genaiscript info env` [command](/genaiscript/reference/cli).
It will display the current configuration information parsed by GenAIScript.

```sh
genaiscript info env
```

## Next steps

Write your [first script](/genaiscript/getting-started/your-first-genai-script).