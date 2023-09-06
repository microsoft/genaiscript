prompt({
    title: "↓ Generate multiple solutions",
    output: ".py",
    description: "Generate multiple solutions to a problem.",
    categories: ["tutorial"],
})

def("STEPS", env.children)

$`Given the problem in STEPS, generate three different solutions.`
