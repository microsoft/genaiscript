import React from "react"
import { VictoryBar, VictoryChart, VictoryGroup, VictoryTheme } from "victory"

export default function BarChart(props: { rows: any[]; headers: string[] }) {
    const { rows, headers } = props
    const x = headers[0]
    const ys = headers.slice(1)

    return (
        <VictoryChart theme={VictoryTheme.clean}>
            <VictoryGroup offset={20} style={{ data: { width: 15 } }}>
                {ys.map((y) => (
                    <VictoryBar
                        key={y}
                        data={rows
                            .filter((row) => row[y])
                            .map((row) => ({
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
