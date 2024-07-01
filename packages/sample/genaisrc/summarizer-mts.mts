
export function summarize(_: any, files: any) {
    _.def("FILE", files)
    _.$`...`
    _.$`Summarize each file. Be concise.`
}