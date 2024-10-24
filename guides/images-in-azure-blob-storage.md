
import { Code } from '@astrojs/starlight/components';
import { Steps } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/azure-blobs.genai.mts?raw"

It is possible to use the Azure Node.JS SDK to download images from Azure Blog Storage
and use them in the prompt. The `defImages` function support the node.js [Buffer] type.

## Configuration

Install the [@azure/storage-blob](https://www.npmjs.com/package/@azure/storage-blob) and [@azure/identity](https://www.npmjs.com/package/@azure/identity) packages.

```sh
npm install -D @azure/storage-blob @azure/identity
```

Make sure to login with the Azure CLI and set the subscription.

```sh
az login
```

## Reading blobs

Open a connection to the Azure Blob Storage and get a client to the container.
We deconstruct the `account` and `container` from the `env.vars` object
so that they can be set through the [cli](/genaiscript/reference/cli).

```ts
import { BlobServiceClient } from "@azure/storage-blob"
import { DefaultAzureCredential } from "@azure/identity"

const { account = "myblobs", container = "myimages" } = env.vars
const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    new DefaultAzureCredential()
)
const containerClient = blobServiceClient.getContainerClient(container)
```

If you do not have a specific blob in mind, you can iterate through the blobs,
and download them into a buffer (`buf`).

```ts "image"
import { buffer } from "node:stream/consumers"

for await (const blob of containerClient.listBlobsFlat()) {
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name)
    const downloadBlockBlobResponse = await blockBlobClient.download(0)
    const body = await downloadBlockBlobResponse.readableStreamBody
    const image = await buffer(body)
    ...
```

## Using images in the prompt

The `image` buffer can be passed in `defImages` to be used in the prompt.

```ts
    defImages(image, { detail: "low" })
```

However since images can be "heavy", you will most likely have to use
[inline prompts](/genaiscript/reference/prompts/inline-prompts) to split into smaller queries. (Note the use of `_.`)

```ts 'await runPrompt(_ =>' '_.'
for await (const blob of containerClient.listBlobsFlat()) {
    ...
    const res = await runPrompt(_ => {
        _.defImages(image, { detail: "low" })
        _.$`Describe the image.`
    })
    // res contains the LLM response for the inner prompt
    ...
```

## Summarizing results

To summarize all images, we store each image summary using the `def` function and 
add prompting to summarize the descriptions.

```ts
    ...
    def("IMAGES_SUMMARY", { filename: blob.name, content: res.text })
}
$`Summarize IMAGES_SUMMARY.`
```

## Full source

<Code code={source} wrap={true} lang="js" title="azure-blobs.genai.mts" />

