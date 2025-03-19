import { titleize as _titlelize, humanize as _humanize } from "inflection"

export function splitalize(text: string) {
    if (!text) return text
    return text?.replace(/([a-z])([A-Z])/g, "$1 $2")
}

export function titleize(text: string) {
    if (!text) return text
    return _titlelize(splitalize(text))
}

export function humanize(text: string) {
    if (!text) return text
    return _humanize(splitalize(text))
}
