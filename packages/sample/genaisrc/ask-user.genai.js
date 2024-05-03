script({ title: "ask-user" })

const question = chat.askUser("what is your question?")

$`Answer this question:

${question}`        
