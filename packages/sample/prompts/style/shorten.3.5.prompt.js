prompt({ title: "Shorten 3.5", replaces: "fragment", model: "gpt-3.5-turbo-0613" })

$`Shorten the following SUMMARY. Limit changes to minimum.`

def("SUMMARY", env.fragment)

$`Respond with the new SUMMARY.`
