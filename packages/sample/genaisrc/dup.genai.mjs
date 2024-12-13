script({
    choices: ["FAIL", "SUCCESS"],
    tests: {
        keywords: "SUCCESS",
    },
})
def("FILE", "hello world")
def("FILE", "hello world")

$`If <FILE> is defined twice in the prompt, respond with FAIL; otherwise respond SUCCESS`
