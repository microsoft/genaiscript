import { fileTypeFromBuffer } from "file-type"
import { CancellationOptions } from "./cancellation"
import { deleteUndefinedValues } from "./cleaners"
import { createFetch } from "./fetch"
import { runtimeHost } from "./host"
import { HTMLEscape } from "./html"
import { TraceOptions } from "./trace"
import { logError, logVerbose } from "./util"

function parseTeamsChannelUrl(url: string) {
    const m =
        /^https:\/\/teams.microsoft.com\/[^\/]{1,32}\/channel\/(?<channelId>.+)\/.*\?groupId=(?<teamId>([a-z0-9\-])+)$/.exec(
            url
        )
    if (!m) throw new Error("Invalid Teams channel URL")
    const { teamId, channelId } = m.groups
    return { teamId, channelId }
}

export interface MicrosoftTeamsEntity {
    webUrl: string
    name: string
}

function generatedByFooter(script: PromptScript, info: { runUrl?: string }) {
    return `\n<blockquote>AI-generated message by ${info.runUrl ? `<a href="${HTMLEscape(info.runUrl)}">${HTMLEscape(script.id)}</a>` : HTMLEscape(script.id)} may be incorrect</blockquote>\n`
}

/**
 * Uploads a file to the files storage of a Microsoft Teams channel.
 * @param channelUrl Shared channel link in the format https://teams.microsoft.com/l/channel/<channelId>/<channelName>?groupId=<teamId>
 * @param filename
 * @returns
 */
async function microsoftTeamsChannelUploadFile(
    token: string,
    channelUrl: string,
    filename: string,
    options?: TraceOptions & CancellationOptions
): Promise<MicrosoftTeamsEntity> {
    logVerbose(`teams: uploading ${filename}...`)

    const { teamId, channelId } = parseTeamsChannelUrl(channelUrl)
    const Authorization = `Bearer ${token}`

    const channelInfoUrl = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}`
    const fetch = await createFetch(options)
    const channelInfoRes = await fetch(channelInfoUrl, {
        headers: {
            Authorization,
        },
    })
    if (!channelInfoRes.ok) {
        throw new Error(
            `Failed to get channel info: ${channelInfoRes.status} ${channelInfoRes.statusText}`
        )
    }
    const channelInfo = await channelInfoRes.json()
    const folder = channelInfo.displayName

    // resolve channel folder name
    const file = await runtimeHost.readFile(filename)
    const url = `https://graph.microsoft.com/v1.0/groups/${teamId}/drive/root:/${folder}/${path.basename(
        filename
    )}:/content`
    const mime = await fileTypeFromBuffer(file)
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization,
            "Content-Type": mime?.mime || "application/octet-stream",
        },
        body: file,
    })
    if (!res.ok) {
        logError(await res.text())
        throw new Error(
            `Failed to upload file: ${res.status} ${res.statusText}`
        )
    }
    const j = (await res.json()) as MicrosoftTeamsEntity
    return j
}

export async function microsoftTeamsChannelPostMessage(
    channelUrl: string,
    subject: string,
    message: string,
    options?: {
        script: PromptScript
        info: { runUrl?: string }
        files?: string[]
    } & TraceOptions &
        CancellationOptions
): Promise<MicrosoftTeamsEntity> {
    logVerbose(`teams: posting message to ${channelUrl}`)

    const { files = [] } = options || {}
    const { teamId, channelId } = parseTeamsChannelUrl(channelUrl)
    const authToken = await runtimeHost.microsoftGraphToken.token("default")
    const token = authToken?.token?.token
    if (!token) {
        logError("Microsoft Graph token not available")
        return undefined
    }

    // convert message to html

    const body = deleteUndefinedValues({
        body: {
            contentType: "html",
            content: message,
        },
        subject,
        attachments: [] as any[],
    })

    for (const file of files) {
        const fres = await microsoftTeamsChannelUploadFile(
            token,
            channelUrl,
            file,
            options
        )
        const guid = crypto.randomUUID()
        body.body.content += "\n" + `<attachment id=\"${guid}\"></attachment>`
        body.attachments = [
            {
                id: guid,
                contentType: "reference",
                contentUrl: fres.webUrl,
                name: fres.name,
                thumbnailUrl: null,
            },
        ]
    }

    // finalize message
    body.body.content += generatedByFooter(options?.script, options?.info)

    const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`
    const fetch = await createFetch(options)
    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const err: any = await response.text()
        logError(err)
        return undefined
    }

    const data: any = await response.json()
    const { webUrl } = data
    logVerbose(`teams: message created at ${webUrl}`)
    return data
}
