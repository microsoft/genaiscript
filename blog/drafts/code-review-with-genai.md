
## Introducing "Code Review with GenAI" 🧐

Have you ever wished for an extra set of eyes while coding? Well, GenAI has got your back! Let's delve into the "Reviewer" script, which automates the code review process, making it a breeze for developers. This powerful script for the GenAIScript platform can be found [here on GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/vscode/genaisrc/prr.genai.mts).

### What is the Script About?

The "Reviewer" script is designed to scan through your code files or git repository changes and report any potential errors or warnings. This is not just any ordinary linter; it's an AI-powered assistant that ensures your code adheres to best practices and is error-free! 🚀

### The Script Breakdown

Let's start by understanding each part of the script and how it contributes to the overall functionality:

#### Script Metadata

```ts
script({
    title: "Reviewer",
    description: "Review the current files",
    model: "openai:gpt-4o",
    system: ["system.annotations"],
    tools: ["fs_find_files", "fs_read_text"],
    cache: "rv",
    parameters: {
        errors: {
            type: "boolean",
            description: "Report errors only",
            default: false,
        },
    },
})
```

This block defines the script's metadata. It sets the `title` and `description` for the script, along with specifying the `model`, which is `openai:gpt-4o` in this case. The `system` and `tools` arrays list the dependencies that the script requires. Lastly, we have `parameters` which can control the behavior of the script—here, we see a boolean named `errors` that determines if only errors should be reported.

#### Configuration

```ts
const { errors } = env.vars
```

In the configuration section, we extract the `errors` parameter from the environment variables to use it later in the script's logic.

#### Context and File Handling

```ts
let content = ""
if (env.files.length) {
    content = def("FILE", env.files, {
        maxTokens: 5000,
        glob: "**/*.{py,ts,cs,rs,c,cpp,h,hpp,js,mjs,mts}",
    })
} else {
    console.log("No files found. Using git diff.")
    const { stdout: diff } = await host.exec("git diff -U6")
    if (!diff) cancel("No changes found, did you forget to stage your changes?")
    content = def("GIT_DIFF", diff, { language: "diff" })
}
```

This part deals with file selection. If files are provided through `env.files`, it defines the content to be reviewed. Otherwise, it falls back to using `git diff` to check for unstaged changes.

#### The Prompt

The prompt is what instructs the AI on what to do. It's a critical part of the script, defining the role, task, and guidelines for the AI to follow during the review process.

```ts
$`
## Role

You are an expert developer at all known programming languages.
You are very helpful at reviewing code and providing constructive feedback.

## Task

Report ${errors ? `errors` : `errors and warnings`} in ${content} using the annotation format.

## Guidance

- Use best practices of the programming language of each file.
- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
- Use tools to read the entire file content to get more context
${errors ? `- Do not report warnings, only errors.` : ``}
`
```

As you can see, the AI's role is that of an expert developer reviewing code. It's tasked with reporting errors (or errors and warnings) in the provided content. The guidance section sets clear expectations for the quality of the review.

### How to Run the Script

To run this script, you'll need the GenAIScript CLI. If you haven't installed it yet, check out the [installation guide](https://microsoft.github.io/genaiscript/getting-started).

Once you have the CLI, running the script is as simple as:

```bash
genaiscript run reviewer
```

Remember to replace `reviewer` with the actual filename if you have saved the script with a different name.

This will execute the script and provide you with the AI's feedback directly in your terminal or command prompt. It's like having a virtual code reviewer at your disposal whenever you need it!

---

And there you have it, a complete walkthrough of the "Reviewer" script. We hope this guide not only helps you understand the script better but also empowers you to enhance your coding workflow with the help of GenAI. Ready to merge with confidence? Give it a try! 🚀✨
