script({ title: "ask-user" })

const question = host.askUser("what is your question?")

$`Answer this question:

${question}`        
