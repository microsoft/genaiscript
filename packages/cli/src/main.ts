import { readFileSync, writeFileSync } from "fs"
import { tokenize } from "./jstokenizer"
import { getSubtasks } from "./refinement"

import { parseProject } from "coarch-core"
import { NodeHost } from "./hostimpl"

async function main() {
    NodeHost.install()

    const x = parseProject({
        coarchFiles: ["../sample/test.coarch.md"],
        promptFiles: [],
        coarchJsonFiles: [],
    })
    // writeFileSync("built/out.json", JSON.stringify(x));

    // tokenize(readFileSync(process.argv[2], "utf8"))

    const r = await getSubtasks({
        // task: "Create an interactive application, GPUSRUS, that allows users to schedule a cluster of GPU resources. The application has web-based user interface for managing available GPU and reservations by the user. It also has a natural language interface to specify schedule preferences.  For example, a user of GPUSRUS might type into a chat window in the application “I need 4 consecutive hours of an A100 GPU and I prefer evenings but not on weekends” The application, which includes a database of GPUs and an existing schedule, will find open slots in the schedule based on the preferences and schedule them after getting confirmation from the user.",
        // task: "A simple web app for users to write and save daily journal entries, with options to view past entries and export their journal data.",
        // task: "A web app that displays a random motivational quote fetched from a built-in list."
        task: "Compute 2+23.",
    })
    console.log(r)
}

main()
