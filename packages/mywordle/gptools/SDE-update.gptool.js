gptool({ title: "SDE-update", 
         description: "Updates code for an application based on a specification of the specific files and APIs provided in a .saplan.gpspec.md file",
         maxTokens: 4000,
         outputFolder: "src",
         model: "gpt-4-32k",
         categories: ["appdev"]  })

def("CODE", env.files.filter(f => f.filename.endsWith(".py")))
def("DOCS", env.files.filter(f => f.filename.endsWith(".gpspec.md")))
def("BUGS", env.files.filter(f => f.filename.startsWith("bug")))

$`
Use documentation from DOCS.  

You are an expert software developer with years of experience implementing Python applications.
You always write syntactically correct code that is easy to read and understand. 
 
The resulting CODE should be complete.  

A software architect has specified the architecture for a new product 
and has defined the APIs for each component in SUMMARY.   
CODE contains the code for the product generated from a previous SUMMARY.

Issues with the current implementation have been described in BUGS.
Issues that have already been resolved are in a section called Past Issues and 
issues that you need to resolve are in a section called New Issues.
Address only the new issues.  Do not make changes related to the Past Issues.

Your job is to make a minimum of updates to CODE to match any changes that have 
made to SUMMARY and to address any new issues mentioned in BUGS.

For each of the Python files listed in SUMMARY, CODE contains the code for
the component which is in a separate file using the file name used in SUMMARY.

Update the only the CODE for files mentioned in SUMMARY that require changes to 
address any updates to SUMMARY or any issues mentioned in BUGS.

Modify as few files as possible and only generate the code for the files that need to be changed.

Respond only with the new CODE.
Be sure to include the file name for each file in CODE even if only one file is changed.

Limit changes to existing code to minimum. 

`
