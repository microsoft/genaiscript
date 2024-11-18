import { TraceOptions } from "./trace"
import { logVerbose } from "./util"

const secretPatterns: Record<string, RegExp> = {
    "AWS Access Key": /AKIA[0-9A-Z]{16}/g,
    "GitHub Token": /ghp_[0-9a-zA-Z]{36}/g,
    "Slack Token": /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    "Google API Key": /AIza[0-9A-Za-z-_]{35}/g,
    "Azure Key": /[0-9a-zA-Z/+]{88}/g,
    "Stripe API Key": /sk_live_[0-9a-zA-Z]{24}/g,
    "Google AI Key": /AIza[0-9A-Za-z-_]{35}/g,
    "OpenAI Key": /sk-[0-9a-zA-Z]{32}/g,
    "Twilio API Key": /SK[0-9a-fA-F]{32}/g,
    "SendGrid API Key": /SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}/g,
    "Facebook Access Token": /EAACEdEose0cBA[0-9A-Za-z]+/g,
    "Twitter Access Token": /[1-9][0-9]+-[0-9a-zA-Z]{40}/g,
    "Twitter Secret Key": /[0-9a-zA-Z]{40}/g,
    "GitLab Personal Access Token": /glpat-[0-9a-zA-Z\-_]{20}/g,
    "DigitalOcean Token": /[0-9a-fA-F]{64}/g,
    "Mailgun API Key": /key-[0-9a-zA-Z]{32}/g,
    "Dropbox Access Token": /sl.[0-9a-zA-Z\-_]{43}/g,
    "Shopify Access Token": /shpat_[0-9a-fA-F]{32}/g,
    "GitHub Personal Access Token": /ghp_[0-9a-zA-Z]{36}/g,
    "Generic API Key": /(?<![a-zA-Z0-9])[a-zA-Z0-9]{32,128}(?![a-zA-Z0-9])/g,
    "JWT Token": /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/g,
    "AWS Access Key ID": /AKIA[0-9A-Z]{16}/g,
    "AWS Secret Access Key":
        /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    "Google Cloud API Key": /AIza[0-9A-Za-z-_]{35}/g,
    "Azure Shared Key": /[A-Za-z0-9+=]{88}/g,
    "Salesforce Security Token": /[A-Za-z0-9]{24}/g,
    "Private SSH Key":
        /-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/g,
    "PEM Certificate":
        /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,
    "PayPal/Braintree Access Token":
        /access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}/g,
    "Database Connection String": /(?:jdbc|odbc):[a-zA-Z0-9@:\/\.\?&=]+/g,
    "Basic Auth Header": /Basic [a-zA-Z0-9=+\/]+/g,
    "Bearer Token Header": /Bearer [A-Za-z0-9\-_]+/g,
    "Google OAuth Refresh Token": /1\/[A-Za-z0-9_-]{43}/g,
    "Kubernetes Secret": /apiVersion:\s+v1[\s\S]+kind:\s+Secret[\s\S]+data:/g,
    "Firebase Database URL": /https:\/\/[a-z0-9-]+\.firebaseio\.com/g,
}

export function hideSecrets(text: string): string {
    if (!text) return text
    let result = text
    for (const pattern of Object.entries(secretPatterns)) {
        let prev = result
        result = result.replace(pattern[1], "***")
        if (prev !== result) {
            logVerbose(`secrets: hidding potential ${pattern[0]} secret`)
            process.stderr.write(pattern[1].exec(prev) + "\n")
        }
    }
    return result
}
