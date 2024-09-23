script({ model: "gpt-4o", system: ["annotations"] })
def("FILE", env.files, { ignoreEmpty: true })

$`Review FILE and report errors and warnings using annotation format.
Answer in plain text.`
