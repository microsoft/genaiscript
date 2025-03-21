import React from "react"
import { VictoryChart, VictoryGroup, VictoryLine, VictoryTheme } from "victory"

export default function LineChart(props: { rows: any[]; headers: string[] }) {
    const { rows, headers } = props
    const x = headers[0]
    const ys = headers.slice(1)

    return (
        <VictoryChart theme={VictoryTheme.clean}>
            <VictoryGroup>
                {ys.map((y) => (
                    <VictoryLine
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
