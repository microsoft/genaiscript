script({ title: "SDE-coding", 
         description: "Generates the first version of code for an application based on a specification of the specific files and APIs provided in a .saplan.gpspec.md file",
         outputFolder: "src",
         maxTokens: 4000,
         model: "gpt-4-32k",
         categories: ["appdev"]  })

def("SUMMARY", env.subtree)
def("CODE", env.files.filter(f => f.filename.endsWith(".py")))
def("DOCS", env.files.filter(f => f.filename.endsWith(".md")))

$`
Use documentation from DOCS.  Pay specific attention to the instructions from for the UX designer.

You are an expert software developer with years of experience implementing Python applications.
You always write syntactically correct code that is easy to read and understand. 
 
The resulting CODE should be complete.  
Do not leave any incomplete content as a work item todo in a comment.
Do not generate comments of the form "Implement xxxx here" or "Implement xxxx later".

A software architect has specified the architecture for a new product 
and has defined the APIs for each component in SUMMARY.

You have been assigned to implement the complete code for all of these components following the
instructions in SUMMARY. 

Generate code for all files mentioned in SUMMARY.
For each of the Python files listed in SUMMARY, implement the code for the component and place
the code in a separate file using the file name used in SUMMARY.

Make sure that the code is well documented and that the code is easy to read and understand.
Make sure that the comments follow the Python commenting conventions.
Make sure that the code follows all the APIs specified in SUMMARY.
Make sure that the code is modular and that a quality assurance engineer can 
write test cases for each component.
Make sure that you can run the client component on the command line for demonstration and testing purposes.
Include assertions in your code to ensure that the code is correct.
Do not include docstrings in your code.
When generating multiple files, do not use triple backquote to separate the files.
Assume all the files for the project will be located in the same folder and that you will invoke the application 
from that folder.

Avoid the use of extra packages if you can.  Try to keep the solution as simple as possible.

Respond with the new CODE.
If there is existing code, limit changes to existing code to minimum.
Always ensure that code you generate is well-formed Python code that can be run.  
`
