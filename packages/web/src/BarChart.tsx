import React from "react"
import { VictoryBar, VictoryChart, VictoryGroup, VictoryTheme } from "victory"
import { JSON5TryParse } from "../../core/src/json5"

export default function BarChart(props: { children: string }) {
    const { children } = props
    const rows: any[] = JSON5TryParse(children)

    // find rows that are numbers
    if (!rows?.length && typeof rows[0] !== "object") return null

    const headers = Object.keys(rows[0])
    const x = headers[0]
    const ys = headers.slice(1)

    return (
        <VictoryChart theme={VictoryTheme.clean}>
            <VictoryGroup offset={20} style={{ data: { width: 15 } }}>
                {ys.map((y) => (
                    <VictoryBar
                        key={y}
                        data={rows.filter((row) => row[y] ).map((row) => ({
                            x: row[x],
                            y: row[y],
                        }))}
                        labels={({ datum }) => datum.y}
                    />
                ))}
            </VictoryGroup>
        </VictoryChart>
    )
}
