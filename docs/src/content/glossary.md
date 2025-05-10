---
title: Glossary
description: A glossary of terms used in the GenAI project.
keywords: glossary, terms, definitions
sidebar:
    order: 200
---

This glossary provides definitions for terms used in the project.
Each term is linked to its corresponding section in the documentation for easy reference.

> This glossary is auto-generated from the source files.

## Terms

- **agent**: GenAIScript's indirection layer to interact with LLMs and tools for file system queries.
- **agents-oct2024**: Presentation on agents from October 2024: [agents-oct2024](https://microsoft.github.io/genaiscript/slides/agents-oct2024/)
- **ast**: Presentation on Abstract Syntax Trees: [ast](https://microsoft.github.io/genaiscript/slides/ast/)
- **best practices**: See [Best Practices](/genaiscript/getting-started/best-practices).
- **build**: Builds the production site to `./dist/`.
- **builtin_tools**: Set of tools referenced in system prompts for data fetching, file operations, and command execution.
- **CLI**: [CLI](/genaiscript/reference/cli) documents the command-line interface for automating GenAIScript execution.
- **content**: Text or data read from a file, subject to transformation.
- **Create Script snippet**: Guidance on creating scripts with Visual Studio Code or editors using GenAIScript commands.
- **default**: Default presentation covering various topics: [default](https://microsoft.github.io/genaiscript/slides/default/)
- **dev**: Starts the local development server at `localhost:4321`.
- **development environment**: Tools and settings used to build and test software.
- **eng-july2024**: Engineering presentation from July 2024: [eng-july2024](https://microsoft.github.io/genaiscript/slides/eng-july2024/)
- **env.files**: When running a script in Visual Studio Code on files or a folder, these are passed as `env.files` for script reuse.
- **feb2025**: Presentation for February 2025: [feb2025](https://microsoft.github.io/genaiscript/slides/feb2025/)
- **fetch**: Fetches data from a URL (restricted to allowed domains).
- **foundation models and LLMs**: Large AI models GenAIScript works with, used for generating text or processing information.
- **fs_ask_file**: Runs an LLM query on file contents
- **fs_data_query**: Queries a file using GROQ syntax.
- **fs_diff_files**: Computes a diff between two files. Use git diff for file version comparisons.
- **fs_find_files**: Finds files matching a glob pattern or content regex. Use cautiously if searching many files.
- **fs_read_file**: Reads a file as text from the file system. Returns undefined if not found.
- **garage-august2024**: Garage presentation from August 2024: [garage-august2024](https://microsoft.github.io/genaiscript/slides/garage-august2024/)
- **GenAIScript**: GenAIScript is a scripting language integrating LLMs into scripts using simplified JavaScript syntax.
- **git_branch_current**: Gets the current branch.
- **git_branch_default**: Gets the default branch using the client.
- **git_branch_list**: Lists all branches in the repository.
- **git_diff**: Computes file diffs using git. Large diffs return only the list of changed files.
- **git_last_tag**: Gets the latest tag in the repository.
- **git_list_commits**: Lists commit history using git log.
- **git_status**: Shows repository status.
- **github_actions_job_logs_diff**: Diffs two GitHub workflow job logs.
- **github_actions_job_logs_get**: Downloads a GitHub workflow job log. For large logs, use log diff.
- **github_actions_jobs_list**: Lists all jobs for a workflow run.
- **github_actions_workflows_list**: Lists all GitHub Actions workflows.
- **github_files_get**: Gets a file from a GitHub repository.
- **github_files_list**: Lists all files in a GitHub repository.
- **github_issues_comments_list**: Lists comments for an issue.
- **github_issues_get**: Gets a single issue by number.
- **github_issues_list**: Lists all issues in a repository.
- **github_pulls_get**: Gets a single pull request by number.
- **github_pulls_list**: Lists all pull requests in a repository.
- **github_pulls_review_comments_list**: Lists review comments for a pull request.
- **grep**: Function to search workspace files by glob pattern and content regex.
- **Markdown**: Lightweight markup language for formatting plaintext. Created by John Gruber in 2004, it's popular for documentation.
- **math_eval**: Evaluates a math expression. Use this tool instead of manual calculations.
- **md_find_files**: Gets file structure of Markdown/MDX documentation. Returns filename, title, and description. Can search content with regex pattern.
- **md_read_frontmatter**: Reads the frontmatter of a Markdown or MDX file.
- **meta_prompt**: Applies OpenAI’s meta prompt guidelines to a user prompt. Based on OpenAI docs.
- **meta_schema**: Generates a valid JSON schema for described JSON. Based on OpenAI docs.
- **msr-eng-may2024**: Microsoft Research Engineering presentation from May 2024: [msr-eng-may2024](https://microsoft.github.io/genaiscript/slides/msr-eng-may2024/)
- **networking-apr2024**: Networking presentation from April 2024: [networking-apr2024](https://microsoft.github.io/genaiscript/slides/networking-apr2024/)
- **newContent**: Modified file content after applying transformations.
- **node_test**: Builds and tests the project using `npm test`.
- **overview-june2024**: Overview presentation from June 2024: [overview-june2024](https://microsoft.github.io/genaiscript/slides/overview-june2024/)
- **overview-may2024**: Overview presentation from May 2024: [overview-may2024](https://microsoft.github.io/genaiscript/slides/overview-may2024/)
- **patches**: Object in a script storing computed transformations for unique content matches.
- **pnw-plse-may2024**: Pacific Northwest PLSE presentation from May 2024: [pnw-plse-may2024](https://microsoft.github.io/genaiscript/slides/pnw-plse-may2024/)
- **presentation_2024**: Series of GenAIScript presentations on topics like engineering, networking, and system prompts, available online.
- **preview**: Previews your build locally before deploying.
- **prompt variable**: A way to include content in the prompt and refer to it later in the GenAIScript script.
- **python_code_interpreter_copy_files_to_container**: Copies files from workspace to container. Only relative paths. Returns copied file paths in the container.
- **python_code_interpreter_read_file**: Reads a file from the container file system. No absolute paths.
- **python_code_interpreter_run**: Executes Python 3.12 code for data analysis in a sandbox. Only core scientific packages available. No network access.
- **React 19**: Current version of React used, providing minimal dependencies.
- **retrieval_fuzz_search**: Fuzzy keyword search over file contents.
- **retrieval_vector_search**: Embeddings-based similarity search over files.
- **retrieval_web_search**: Searches the web using Tavily or Bing Search.
- **runPrompt**: Function to generate LLM prompts, defining context and task for required transformations.
- **samples**: Sample scripts for GenAIScript, ready to use and modifiable. Community contributions are in the [Awesome Scripts](/genaiscript/samples/awesome) section.
- **schemas**: GenAIScript supports output formats like file edits, JSON, and user-defined schemas: [Schemas](/genaiscript/reference/scripts/schemas).
- **script**: Defines a sequence of commands within GenAIScript, including title, description, and parameters.
- **Scripts**: [Scripts](/genaiscript/reference/scripts) provide a domain-specific JavaScript framework to build LLM requests.
- **search and transform**: Uses LLMs for transformations based on text patterns, beyond simple search and replace.
- **seattlejs-jan2025**: SeattleJS presentation from January 2025: [seattlejs-jan2025](https://microsoft.github.io/genaiscript/slides/seattlejs-jan2025/)
- **system prompts**: Prompts for guarding against harmful content and jailbreaking. See [Content Safety](/genaiscript/reference/scripts/content-safety).
- **think**: Appends a reasoning step to the log. Use for complex thought or memory caching—doesn't alter data.
- **tools**: JavaScript callbacks registered with the LLM that execute code, search the web, read files, and more.
- **transcribe**: Generates a transcript from audio/video using speech-to-text.
- **translation**: Case study of GenAIScript translating document fragments: [Translation Case Study](/genaiscript/case-studies/documentation-translations).
- **user_input_confirm**: Requests user confirmation for a message.
- **user_input_select**: Prompts user to select an option.
- **user_input_text**: Prompts user to input text.
- **video_extract_audio**: Extracts audio from video to create an audio file. Returns filename.
- **video_extract_clip**: Extracts a video clip from a file. Returns filename.
- **video_extract_frames**: Extracts frames from a video file.
- **video_probe**: Returns video file metadata.
- **vision_ask_images**: Runs vision models to query images.
- **Visual Studio Code Extension**: [Visual Studio Code Extension](/genaiscript/reference/vscode) offers features to author, debug, and deploy GenAIScripts.
- **vs-aua**: Presentation on Visual Studio and AUA: [vs-aua](https://microsoft.github.io/genaiscript/slides/vs-aua/)
- **vscode-elements**: Design system that mimics Visual Studio Code's look and feel.
- **workspace**: GenAIScript environment for manipulating files, including searching, reading, and writing.
- **z3**: Solves SMTLIB2 problems with the Z3 constraint solver.
