import { Terminal } from "@xterm/xterm"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { FitAddon } from "@xterm/addon-fit"
import { AttachAddon } from "@xterm/addon-attach"
import { useEffect, useRef } from "react"
import React from "react"

const terminal = new Terminal()
terminal.loadAddon(new WebLinksAddon())
const fitter = new FitAddon()
terminal.loadAddon(fitter)

export function Termina2l() {
    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (containerRef.current) {
            terminal.open(containerRef.current)
            fitter.fit()
        }
    }, [])
    return (
        <div
            style={{ width: "100%", minHeight: "20rem" }}
            ref={containerRef}
        ></div>
    )
}
