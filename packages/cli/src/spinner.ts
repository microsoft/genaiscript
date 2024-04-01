import ora, { Ora } from "ora"
import { Progress } from "genaiscript-core"

class ProgressSpinner implements Progress {
    constructor(readonly spinner: Ora) {}
    report(value: {
        message?: string
        increment?: number
        succeeded?: boolean
    }): void {
        const { message, succeeded } = value
        if (succeeded === true) {
            this.spinner.succeed(message)
        } else if (succeeded === false) {
            this.spinner.fail(message)
        } else if (message) this.spinner.start(message)
    }
}

export function createProgressSpinner(
    message: string,
    interval = 200
): Progress {
    return new ProgressSpinner(ora({ interval }).start(message))
}
