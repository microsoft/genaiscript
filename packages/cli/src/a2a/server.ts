import * as http from "http"
import { AgentCard, AgentSkill } from "./schema"
import { TOOL_ID } from "../../../core/src/constants"
import { readJSON } from "../../../core/src/fs"
import { buildProject } from "../build"

export async function a2aAgentCard(
    res: http.ServerResponse<http.IncomingMessage> & {
        req: http.IncomingMessage
    }
) {
    const pkg = await readJSON("./package.json")
    const prj = await buildProject()
    const scripts = prj.scripts.filter((s) => !s.isSystem)
    const card = {
        name: pkg.name,
        url: pkg.url,
        version: pkg.version,
        capabilities: {},
        skills: scripts.map(
            (s) =>
                ({
                    id: s.id,
                    name: s.id,
                    description: s.description,
                    tool: TOOL_ID,
                    icon: s.icon,
                    parameters: s.parameters,
                    examples: s.examples,
                }) satisfies AgentSkill
        ),
    } satisfies AgentCard

    res.setHeader("Content-Type", "application/json")
    res.statusCode = 200

    res.end(JSON.stringify(card, null, 2))
}
