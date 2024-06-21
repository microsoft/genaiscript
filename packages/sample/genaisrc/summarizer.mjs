export function summarize(_, files) {
    _.def("FILE", files)
    _.$`...`
    _.$`Summarize each file. Be concise.`
}