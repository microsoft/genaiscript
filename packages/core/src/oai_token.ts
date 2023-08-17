import { throwError } from "./error"
import { OAIToken, host } from "./host"
import { fromBase64, logInfo, logWarn, utf8Decode } from "./util"

let cfg: OAIToken

function validateTokenCore(token: string, quiet = false) {
    if (token.startsWith("oaip_")) return

    let timeleft = 0
    const p = token.split(".")[1]
    try {
        const data = JSON.parse(utf8Decode(fromBase64(p)))
        timeleft = Math.round((data.exp * 1000 - Date.now()) / 1000)
        if (!quiet)
            logInfo(
                `token for: ${data.name} <${data.unique_name}>, valid for ${timeleft} seconds`
            )
    } catch (e) {
        throw new Error("invalid token structure")
    }
    if (timeleft < 60) throw new Error("token expired")
}

export async function clearToken() {
    await host.setSecretToken(undefined)
    cfg = undefined
}

export async function initToken(force = false) {
    if (cfg && !force) {
        // already set? revalidate
        try {
            validateTokenCore(cfg.token, true)
            return cfg
        } catch {}
    }

    cfg = await host.getSecretToken()
    if (cfg && !force) {
        try {
            validateTokenCore(cfg.token)
            return cfg
        } catch (e) {
            logWarn(e.message)
        }
    }

    const f = await host.askToken()
    if (f === undefined) throwError("token not specified", true)
    if (!f) throw new Error("token not specified")

    let m = /(https:\/\/[\-\w\.]+)\S*#key=(\w+)/.exec(f)
    if (m) {
        const url = m[1] + "/openai/deployments/"
        const token = m[2]
        validateTokenCore(token)
        cfg = { url, token }
        await host.setSecretToken(cfg)
        return cfg
    }

    m = /https:\/\/[\-\w]+.openai\.azure\.com\/openai\//i.exec(f)
    if (m) {
        const url = m[0] + "deployments/"
        m = /bearer (ey[\w\.\-]+)/.exec(f)
        if (m) {
            const token = m[1]
            validateTokenCore(token)
            cfg = { url, token }
            await host.setSecretToken(cfg)
        }
        return cfg
    } else {
        throw new Error("can't find URL in token text")
    }
}
