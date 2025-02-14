import _ci from "ci-info"
import { confirm } from "@inquirer/prompts"
import { logVerbose } from "../../core/src/util"
import { indent } from "../../core/src/indent"

const confirmed: string[] = []

export async function confirmOrSkipInCI(
    message: string,
    options?: { preview?: string }
): Promise<boolean> {
    if (ci.isCI || confirmed.includes(message)) return true

    const { preview } = options || {}

    if (preview) {
        logVerbose(indent(`preview:`, " "))
        logVerbose(indent(preview, "  "))
    }
    const res = await confirm({
        message,
        default: true,
    })
    if (res) confirmed.push(message)
    return res
}

export const ci = _ci
