script({
    model: "small",
    files: "src/templates/basic.prompty",
    tests: {
        keywords: ["CORRECT1", "CORRECT2", "CORRECT3"],
    },
})

def("START", env.files, { lineStart: 29 })
def("END", env.files, { lineEnd: 40 })
def("RANGE", env.files, { lineStart: 29, lineEnd: 40 })

$`Respond CORRECT1 if START starts with "system:" otherwise INCORRECT
Respond CORRECT2 if END ends with "user:" otherwise INCORRECT
Respond CORRECT3 if RANGE starts with "system:" and end with "user:" otherwise INCORRECT`.role("system")
