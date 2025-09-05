script({
    title: "Code Optimizer",
    description:
        "Optimize code to run faster, modified from https://twitter.com/mattshumer_/status/1719403205950349588.",
    maxTokens: 2000,
    group: "samples",
    system: ["system", "system.diff"],
})

// Modified from https://twitter.com/mattshumer_/status/1719403205950349588?s=46
def("FILE", env.files)

$`
You are a world expert in making code run faster. You use any resource you can to do so.

Given some code in FILE files, identify how long it might take to run.

After that, identify which parts are key candidates to speed up.

After that, order the candidates by ranking.

Take the top-ranked candidate and explain in more detail how to rewrite the code to be faster using a DIFF format. 
Then, rewrite the actual code. 
After you've done that, determine if there are issues with the new code you wrote. 
If so, move on. Otherwise, rewrite the code again to fix them.

Update FILE files with all of the speed improvements.
`
