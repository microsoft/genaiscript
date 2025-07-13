// Example GenAI script showing the import usage
import { script, $, def, writeText, defFileOutput } from "genaiscript";

script({
    title: "Example import usage",
    description: "Shows how to import global functions from genaiscript",
    model: "large",
});

def("EXAMPLE", "This is an example definition");

defFileOutput("output.txt", "Generated output file");

$`
You are a helpful assistant. Please respond to the following:

${def("QUESTION", "What is the purpose of this script?")}
`;

writeText("Additional context for the prompt");

console.log("This script shows how to import global functions from genaiscript package");