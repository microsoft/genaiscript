# gptools: Empowering Human Workflows with AI-Enhanced Tools
- Authors: Peli de Halleux, Michał Moskal, Ben Zorn
- Date: October 2023

## Complex Artifacts Require Complex Workflows

- Software development is a complex process that requires the coordination of many different activities.
- Historically, software development has been a highly manual process, with developers using a variety of tools to create and maintain the artifacts that comprise a software system.
- Over time abstractions have been developed to help manage the complexity of software development.
    - Important examples include: Unix utilities and pipes, makefiles, etc.
- Modern software development includes many automated processes as well as manual processes such as code review, design review, bug triage, etc.

## Foundation Models Create New Opportunities

- The recent development of foundation models (aka LLMs) have created new opportunities for automating complex workflows.
- AI has important advantages over traditional software
    - AI models can perform tasks normal software cannot
    - AI models can be instructed using natural language, allowing non-programmers to use them
- AI models also have disadvantages
    - AI models are not perfect, and can make mistakes
    - AI models are not transparent, and it is difficult to understand why they make the decisions they do
- AI models are best used to augment human workflows, not replace them

## gptools - a Framework for AI-Enhanced Workflows

Vision: empower individuals, including non-developers, to use AI-enhanced scripts to support their efforts to create, understand, and maintain complex artifacts

Goals: support tool abstraction, modularity, reuse, but at the same time empower non-developers to author, maintain, and update AI-enhanced scripts

Approach: Foundation models enable a new kind of scripting that allows script writers to achieve both greater functionality and greater ease of use.  We separate scripts into two related parts: a generic reuseable *gptool* and a natural language *gpspec* that instantiates the gptool in a particular context

Key elements of gptools:
- *gptools* – Scripts that integrate traditional code and natural language and leverage foundation models in their execution
- *gpspecs* – Natural language documents that instantiate gptools in a particular context
- *gpvm* – A framework and runtime system that executes gpspecs and gptools
- *gptools extension to VS code* – supporting seamless user interaction with gptools

## gptool: A New Kind of Script

- A gptool is a script with the following components
    - A header that contains metadata related to the execution of the script (e.g., information about what LLM model to use, etc.)
    - A natural language prompt intended to be processed by a foundation model
    - An environment context that augments the natural language with additional data/information
    - Programming language constructs that are used to programmatically manipulate both inputs and outputs

- Benefits of gptools
    - By separating the gptool from the gpspec, we allow gptools to become highly engineering shared artifacts that form the basis of shared libraries.  
    - A gptool can be used in many different contexts, and can be updated and maintained independently of the gpspecs that use it.
    - By separating the gptool from the gpspec, we allow non-developers to use gptools without having to understand the details of how they work.
    - At the same time, because a gptool contains a natural langauge prompt, it is easy for a non-developer to understand what the gptool does, and to modify it to suit their needs.

## gpspec: Natural language to invoke a gptool

Just as a chat enables a user to interact with an AI model, a gpspec is a natural language markdown document that defines a context in which to invoke a gptool.

A gpspec is a standard markdown file with the following additional elements:
- Links to context elements that define the context in which a particular gptool is to be invoked.  The gpspec defines all possible contexts where a particular gptool might only refer to some part.
- Natural language describing the specific task to be performed as input to one or more gptools.  For example, the spec for code might contain directions on the desired code as well as information about tests to be performed.  Different gptools invoked from the gpspec file can be used to perform different tasks.

Note that one use of a gpspec would be to invoke a gptool to create a new gpspec with further refinement.

## gptools Extension to VS Code

We believe that human oversight of AI models is essential to their effective use.  To support this, we have created a VS Code extension that allows a user to interact with a gptool in a natural way.

The extension provides the following capabilities:
- A command palette that allows a user to select a gptool to invoke in the context of a given gpspec file
- A token management system that supports connecting with the AI model of interest
- A runtime environment that:
    - Captures the context defined by the gpspec
    - Expands the gptool in the appropriate context
    - Executes whatever code is present in the gptool
    - Sends the results to the AI model
    - Processes the results on return to update the user context (which might include updating files, etc.)
- A user interface that allows the user to interact with the AI model to refine the results
- An gptool trace viewing mechanism that allows users to understand how the AI model was used to generate the results




