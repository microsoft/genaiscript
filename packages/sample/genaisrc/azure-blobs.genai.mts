import { BlobServiceClient } from "@azure/storage-blob"
import { DefaultAzureCredential } from "@azure/identity"
import { buffer } from "node:stream/consumers"

script({
    parameters: {
        account: {
            description: "Azure Storage Account Name",
            default: "genaiscript",
            type: "string",
        },
        container: {
            description: "Azure Storage Container Name",
            default: "images",
            type: "string",
        },
    },
})

const { account, container } = env.vars
const url = `https://${account}.blob.core.windows.net`
console.log(`analyzing images in ${account}/${container} at ${url}`)
const blobServiceClient = new BlobServiceClient(
    url,
    new DefaultAzureCredential()
)
const containerClient = blobServiceClient.getContainerClient(container)
for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`blob: ` + blob.name)
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name)
    const downloadBlockBlobResponse = await blockBlobClient.download(0)
    const body = await downloadBlockBlobResponse.readableStreamBody
    const image = await buffer(body)

    const res = await runPrompt(_ => {
        _.defImages(image, { detail: "low" })
        _.$`Describe the images.`
    })

    def("IMAGES_SUMMARY", { filename: blob.name, content: res.text })
}

$`Summarize IMAGES_SUMMARY.`

