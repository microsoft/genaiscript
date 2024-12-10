
### Getting Started

-   **What is GenAIScript and how does it work?**
    GenAIScript is a framework that allows users to create AI-enhanced scripts to automate tasks. It uses simple commands and integrates with AI models to execute tasks based on user-written prompts.

-   **Who can use GenAIScript and do I need to be a developer?**
    Anyone can use GenAIScript, including non-developers. It's designed to be user-friendly, but some basic understanding of scripting or programming can be helpful.

-   **What are the prerequisites for using GenAIScript?**
    You'll need to have VS Code installed to use the GenAIScript extension, and some familiarity with programming concepts is beneficial but not necessary.

-   **How do I install the GenAIScript framework and its VS Code extension?**
    The specific installation steps are documented here: [Installation](/genaiscript/getting-started/installation)

-   **Do I need to install Node.JS?**
    Yes. To install it, follow the [installation instructions](/genaiscript/reference/cli/).

-   **Can I use GenAIScript in IDEs other than VS Code?**
    Currently, GenAIScript is integrated with VS Code, but it can be written in any IDE. The VS Code extension, however, provides additional support for creating and debugging scripts. Although not thoroughly tested, you can use GenAIScript in VS Code variants like Cursor.

-   **What are foundation models and LLMs in the context of GenAIScript?**
    Foundation models and LLMs (Large Language Models) are AI models that GenAIScript can interact with to perform tasks like generating text or processing information.

-   **How do I write my first GenAIScript?**
    Start by learning the basics of JavaScript and the GenAIScript framework, then use the VS Code extension to create a script that defines the task, calls the LLM, and processes the output. More information is available here: [Getting Started](/genaiscript/getting-started)

### Using GenAIScript

-   **How do I debug a GenAIScript in VS Code?**
    Use the GenAIScript extension in VS Code, which provides tools for running, debugging, and tracing the execution of your script. Directions for debugging are here: [Debugging](/genaiscript/getting-started/debugging-scripts)

-   **What are the best practices for authoring effective prompts in GenAIScript?**
    See [Best Practices](/genaiscript/getting-started/best-practices)

-   **How can I integrate calls to multiple LLM models within a single GenAIScript?**
    The framework allows you to parameterize calls to different models, so you can include multiple model invocations within your script and manage them accordingly using the runPrompt function documented here: [Inline Prompts](/genaiscript/reference/scripts/inline-prompts)

-   **Can GenAIScript generate outputs in formats other than JSON?**
    Yes, GenAIScript supports multiple output formats, including file edits, JSON, and user-defined schema. More information here: [Schemas](/genaiscript/reference/scripts/schemas)

-   **How do I execute a GenAIScript from the command line?**
    Once you have a GenAIScript packaged, you can run it from the command line like any other script. More information here: [Command Line](/genaiscript/getting-started/automating-scripts)

-   **Can GenAIScripts take input from files in multiple formats, such as .pdf or .docx?**
    Yes, the GenAIScript framework has built-in support for reading .pdf and .docx formats. See the documentation pages [PDF](/genaiscript/reference/scripts/pdf) and [DOCX](/genaiscript/reference/scripts/docx) for more information.

### Advanced Features

-   **How can I use GenAIScript to automate document translation?**
    One of our case studies illustrates the use of GenAIScript for translating document fragments between languages: [Translation Case Study](/genaiscript/case-studies/documentation-translations)

-   **Can I use GenAIScript to summarize documents or create dialogues from monologues?**
    Yes, LLMs are good at summarizing and can be used within GenAIScript to summarize documents or convert monologues into dialogues.

### Troubleshooting

-   **What should I do if I encounter errors while running a GenAIScript?**
    Check the error messages, consult the documentation, and use the debugging tools in the VS Code extension to identify and resolve issues.

-   **How can I troubleshoot issues with the LLM output parsing in GenAIScript?**
    Review the prompt and output, ensure your script correctly handles the LLM's response, and adjust your parsing logic as needed.

-   **Where can I find examples of GenAIScript to understand its capabilities better?**
    Visit the GenAIScript GitHub repository for examples and documentation. [GenAIScript Documentation](/genaiscript/)

### Security and Responsible AI

-   **What are the unintended uses of GenAIScript and how can I avoid them?**
    Unintended uses include any malicious applications. To avoid them, follow Responsible AI practices and use recommended models with safety features.

-   **How does GenAIScript align with Responsible AI practices?**
    GenAIScript encourages the use of models with robust Responsible AI mitigations and provides guidance on secure and ethical usage.
    For more information, see the [Transparency Note](/genaiscript/reference/transparency-note)

-   **What foundation models and LLMs are recommended for use with GenAIScript?**
    Services like Azure Open AI with updated safety and Responsible AI features are recommended. GenAIScript can also be used with existing open-source LLMs.

-   **Do you provide system prompts to guard against common problems like harmful content or jailbreaking?**
    Yes, GenAIScript includes system prompts to guard against harmful content and jailbreaking. For more information, see the [Content Safety](/genaiscript/reference/scripts/content-safety) documentation.

-   **Do you support Azure Content Services?**
    Yes, GenAIScript provides APIs to interact with Azure Content Safety services. For more information, see the [Content Safety](/genaiscript/reference/scripts/content-safety) documentation.

### Community and Support

-   **Where can I find the GenAIScript community for discussions and support?**
    The GenAIScript GitHub repository is a good place to start for community discussions and support. [GenAIScript GitHub](https://github.com/microsoft/genaiscript/)

-   **How can I contribute to the GenAIScript project?**
    Check the repository for contribution guidelines and consider providing feedback, submitting issues, or contributing code. Visit the [Contributing](https://github.com/microsoft/genaiscript/blob/main/CONTRIBUTING.md) page for more information.

-   **Who can I contact for feedback or questions about GenAIScript?**
    You can email the provided contacts in the [Transparency Note](/genaiscript/reference/transparency-note/) document for feedback or questions.

### Updates and Roadmap

-   **How often is GenAIScript updated and how can I stay informed about new features?**
    You can follow the GitHub repository for updates and announcements.

-   **Is there a roadmap available for GenAIScript's development?**
    The GitHub repository will provide information on future development plans.
