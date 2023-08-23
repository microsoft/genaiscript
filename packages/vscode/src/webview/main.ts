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
    ignoreOutputs: boolean
}

function main() {
    const ignoreOutputs = document.getElementById("ignore-outputs") as Checkbox

    const sendState = () => {
        vscode.postMessage({
            command: "state",
            state: <PromptContextState>{
                ignoreOutputs: !!ignoreOutputs.checked,
            },
        })
    }
    const receiveState = (data: {
        command: "state"
        state: PromptContextState
    }) => {
        const { command, state } = data
        if (command === "state" && state) {
            ignoreOutputs.checked = !!state.ignoreOutputs
        }
    }

    window.addEventListener("message", (msg) => receiveState(msg.data), false)
    ignoreOutputs.addEventListener("change", sendState, false)

    vscode.postMessage({ command: "ready" })
}
