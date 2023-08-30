prompt({ title: "Shorten", replaces: "fragment", context: "root" })

$`Shorten the following SUMMARY. Limit changes to minimum.`

def("SUMMARY", env.fragment)

$`Respond with the new SUMMARY.`
