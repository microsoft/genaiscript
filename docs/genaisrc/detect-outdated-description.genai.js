// Define the file to be analyzed
def("DOC_FILE", env.files, { endsWith: ".md", maxTokens: 2000 })

// Analyze the content to detect outdated descriptions
$`Check if the 'description' field in the front matter in DOC_FILE is outdated.`

// enable diagnostics generation
$`Generate an error for each outdated description.`
