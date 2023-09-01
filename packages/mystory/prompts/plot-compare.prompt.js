prompt({ title: "plot-compare", 
         description: "Give a file with multiple story plots, rate them",
         output: ".compare-plots.coarch.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         categories: ["fiction"]  })

def("SUMMARY", env.subtree)
def("COMPARISON", env.output)
def("PLOTIDEAS", env.links.filter(f => f.filename.endsWith(".plots.coarch.md")))

$`
You are an experienced writer of fiction and you have been given a framing for a short story, 
which is in SUMMARY.
A number of potential different plots ideas have been created for the story in PLOTIDEAS.

You will generate COMPARISON.

In comparison, use the plot framing in SUMMARY and the plots in PLOTIDEAS to generate a comparison of the plots.
The comparison should include subsections, one per plot idea, that include
a comparison of the plots in PLOTIDEAS and a rating of each plot.
In each comparison, you should consider the suggested plot and rate in from A to F
in the following categories and provide a one sentence justification for each rating:
- How well the story fits the framing.
- How engaging the story is.
- How engaging the characters are.
- How innovative and creative the story is.
- Whether the story is suitable for plot twists and surprises.
- Whether the story is suitable for a series of stories.
- Whether the story will appeal the a broad audience.
- How the story compares to award-winning stories in the genre.
- An overall rating for the story.

For each plot idea, include a subsection with a 1 paragraph summary that captures an overview review and evaluation of it.

The final section of the document should identify which plot is the best and why.
`
