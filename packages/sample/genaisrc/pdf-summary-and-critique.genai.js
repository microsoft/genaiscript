// metadata (including model parameters)
script({ title: "pdf-summary-and-critique" })

// use def to emit LLM variables
def("PDFSOURCE", env.files, { endsWith: ".pdf" })

// use $ to output formatted text to the prompt
$`You are a helpful assistant.
Summarize the content of PDFSOURCE and provide a critique of the document.
`        
