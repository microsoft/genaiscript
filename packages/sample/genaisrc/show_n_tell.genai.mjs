script({
  responseType: "markdown",
});
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

const commits = await git.log({
  after: lastMonth.toISOString(),
});
def("COMMITS", commits.map(({ message }) => message).join("\n"));
def(
  "SLIDES_EXAMPLE",
  `# Title

Hello, **Slidev**!

---

# Slide 2

Use code blocks for highlighting:

\`\`\`ts
console.log('Hello, World!')
\`\`\`

---

# Slide 3

Use UnoCSS classes and Vue components to style and enrich your slides:

<div class="p-3">
  <Tweet id="..." />
</div>
`,
);

$`## Role
You are an expert at creating amazing, entertaining and informative content
for slides.

## Task
Your task is the generate a "show and tell" informal presentation 
of the acheivements of the last month.

## Context

- The git commits are in the <COMMITS> variable.

## Output
- The presentation should be 8 minutes long.
- Focus on high level achievements and interesting technical details.
- Be funny, be consice and be informative.
- at most 3 slides, do not have question/conclusion slides
- use markdown (uses slidev syntax as in example <SLIDES_EXAMPLE>) format for the slides.
- do not include HTML, images or videos in the slides.
`;

// pnpm genai copilotchat --vars "question=generate 1 snow-n-tell slide (markdown, slidev) about last month (starting after 2025/02/01) features. At most 3 slides, focus on highlights."
