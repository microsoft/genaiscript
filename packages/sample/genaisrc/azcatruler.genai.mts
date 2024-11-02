script({
    title: "azcat ruler",
})

type AzCatRule = {
    id: string
    description: string
    label: string
    severity: string
    links: { title: string; url: string }[]
}

type AzCatReport = {
    settings: any
    projects: {
        path: string
        ruleInstances: {
            incidentId: string
            ruleId: string
            projectPath: string
            state: "Active" | "Inactive"
            location: {
                kind: "File" | "Binary"
                path: string
                snippet: string
                protectedSnippet: string
                label?: string
                line?: number
                column?: number
            }
        }[]
    }[]
    rules: Record<string, AzCatRule>
}

const report: AzCatReport = await workspace.readJSON(
    env.files[0] || "eShopLegacyMVC-no_dependencies.appcat.json"
)
const { rules, projects } = report
const dir = "net472"
console.log(`found ${projects.length} projects`)

for (const rule of Object.values(report.rules)) {
    const { id, description, severity, links } = rule
    const ruleInstances = projects.flatMap((p) =>
        p.ruleInstances.filter((r) => r.ruleId === id)
    )
    if (ruleInstances.length < 4) continue

    const res = await runPrompt(
        async (_) => {
            _.$`Analyze the ERROR reported by the AzCAT tool.
          
          Cluster the ERROR in related groups by root cause and assign a label to each group.
  
          Report results in JSON.
          Validate JSON schema GROUPS_SCHEMA
  
          - do NOT invent incidentId values
          `
            _.defSchema("GROUPS_SCHEMA", {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        label: { type: "string" },
                        rootCause: { type: "string" },
                        incidentIds: {
                            type: "array",
                            items: {
                                type: "string",
                                description: "incidentId",
                            },
                        },
                    },
                },
            })
            for (const ruleInstance of ruleInstances) {
                const { location, incidentId } = ruleInstance
                _.def(
                    "ERROR",
                    {
                        filename: path.join(dir, location.path),
                        content: `// incidentId: ${incidentId}
              ${
                  location.line
                      ? `[${location.line}] ${location.snippet}`
                      : location.snippet
              }`,
                    },
                    { lineNumbers: false }
                )
            }
        },
        {
            model: "large",
            cache: "rulerz",
            label: `rule ${id}, ${ruleInstances.length} instances`,
            system: [
                "system",
                "system.annotations",
                "system.schema",
                "system.files",
                "system.files_schema",
            ],
        }
    )

    const frame = res.frames[0]
    const data: {
        ruleId: string
        label: string
        rootCause: string
        incidentIds: string[]
    }[] = frame.data as any
    for (const group of data) {
        const incidents = group.incidentIds.slice(0)
        group.ruleId = id
        group.incidentIds = []
        for (const incidentId of incidents) {
            if (
                ruleInstances.find(
                    (r) =>
                        r.incidentId.toLowerCase() === incidentId.toLowerCase()
                )
            ) {
                group.incidentIds.push(incidentId)
            } else console.warn(`incidentId ${incidentId} not found`)
        }
    }

    console.log(YAML.stringify(data))
}
