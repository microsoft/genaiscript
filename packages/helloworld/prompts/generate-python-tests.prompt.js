prompt({
    title: "Generate python tests",
    output: ".tests.py",
    replaces: "nothing",
    model: "gpt-4",
    temperature: 0.05,
    description: "Given a task and code, generate tests",
    system: ["system.code"],
    categories: ["tutorial"],
})

def("TESTS", env.output)
def("TASK", env.children)
def("CODE", env.links.filter(f => f.filename.endsWith(".py")))

$`Python has been written for the task in TASK. The code is in CODE.
Generate 5 tests for the code in CODE.
If the tests are already present in TESTS, ensure that the tests
match the description in TASK and the code in CODE.  If they do not,
update the tests to match the code and the description.

Include a test harness that can run the tests from the command line
Ensure that the result is well-formed Python code`
