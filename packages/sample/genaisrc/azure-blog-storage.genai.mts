import { BlobServiceClient } from "@azure/storage-blob"
import { DefaultAzureCredential } from "@azure/identity"

script({
    parameters: {
        account: {
            description: "Azure Storage Account Name",
            default: "myaccount",
            type: "string",
        },
        container: {
            description: "Azure Storage Container Name",
            default: "mycontainer",
            type: "string",
        },
    },
})

const { account, container } = env.vars
const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    new DefaultAzureCredential()
)
const containerClient = blobServiceClient.getContainerClient(container)
for await (const blob of containerClient.listBlobsFlat()) {
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name)
    const downloadBlockBlobResponse = await blockBlobClient.download(0)
    const body = await downloadBlockBlobResponse.readableStreamBody
    const buffer = await body.read()
    const res = await runPrompt((_) => {
        _.defImages(buffer)
        _.$`Describe the image.`
    })
    // do something with res?
}
