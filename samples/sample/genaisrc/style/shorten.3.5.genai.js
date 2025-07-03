script({
    title: "Shorten 3.5",
    description: "Shorten the summary of the fragment using cheaper model.",
    model: "gpt-3.5-turbo-0613"
})

$`Shorten the following SUMMARY. Limit changes to minimum.`

def("SUMMARY", env.files)

$`Respond with the new SUMMARY.`
