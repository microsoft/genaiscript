script({
    title: "Generate python tests",
    model: "gpt-4-32k",
    description: "Given a task and code, generate tests",
    group: "hello world",
    system: ["system", "system.explanations", "system.files", "system.python"],
    temperature: 0,
})

const spec = env.files.find((f) => f.filename.endsWith(".md"))
def(
    "TESTS",
    env.files.filter((f) => /^test_*\.py$/.test(f.filename))
)
def("TASK", spec)
def(
    "CODE",
    env.files.filter(
        (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
    )
)

$`Python has been written for the task in TASK. The code is in CODE.
Generate 5 tests for the code in CODE in a separate file.
Do not modify or duplicate the code in CODE.

If the tests are already present in TESTS, ensure that the tests
match the description in TASK and the code in CODE.  If they do not,
update the tests to match the code and the description.

Use this format for test file names: "test_*.py".
 
Include the unittest test harness that can run the tests from the command line.`
