import {
    provideVSCodeDesignSystem,
    vsCodeButton,
    vsCodeCheckbox,
    Button,
    Checkbox,
} from "@vscode/webview-ui-toolkit"

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeCheckbox())

// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi()

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener("load", main)

interface PromptContextState {
    ignoreOutput: boolean
}

function main() {
    const ignoreOutput = document.getElementById("ignore-output") as Checkbox

    const sendState = () => {
        vscode.postMessage({
            command: "state",
            state: <PromptContextState>{
                ignoreOutput: !!ignoreOutput.checked,
            },
        })
    }
    const receiveState = (data: {
        command: "state"
        state: PromptContextState
    }) => {
        const { command, state } = data
        if (command === "state" && state) {
            ignoreOutput.checked = !!state.ignoreOutput
        }
    }

    window.addEventListener("message", (msg) => receiveState(msg.data), false)
    ignoreOutput.addEventListener("change", sendState, false)

    vscode.postMessage({ command: "ready" })
}
