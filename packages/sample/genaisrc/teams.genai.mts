import { DefaultAzureCredential } from "@azure/identity"

const { teamId, channelId } = /^https:\/\/teams.microsoft.com\/*.\/channel\/(?<channelId>.+)\/.*\?groupId=(?<teamId>([a-z0-9\-])+)$/.exec(env.vars.link).groups
const message = "Hello from GenAIScript!"

// Function to get Microsoft Graph API token using Managed Identity
async function getToken(): Promise<string> {
    const credential = new DefaultAzureCredential()
    const tokenResponse = await credential.getToken(
        "https://graph.microsoft.com/.default"
    )
    if (!tokenResponse) {
        throw new Error("Failed to retrieve access token.")
    }
    return tokenResponse.token
}

// Function to post a message in a Teams channel
async function postMessage(
    token: string,
    teamId: string,
    channelId: string,
    message: string
): Promise<void> {
    const url = `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    }
    const body = JSON.stringify({
        body: {
            content: message,
        },
    })

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: body,
        })

        if (!response.ok) {
            throw new Error(
                `Failed to post message: ${response.status} ${response.statusText}`
            )
        }

        const data = await response.json()
        console.log("Message posted successfully:", data)
    } catch (error) {
        console.error("Error posting message:", error)
    }
}

const token = await getToken()
await postMessage(token, teamId, channelId, message)
