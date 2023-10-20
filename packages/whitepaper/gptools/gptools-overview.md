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

Key elements of gptools:
- *gptools* – Scripts that integrate traditional code and natural language and leverage foundation models in their execution
- *gpspecs* – Natural language documents that instantiate gptools in a particular context
- *gpvm* – A framework and runtime system that executes gpspecs and gptools
- *gptools extension to VS code* – supporting seamless user interaction with gptools



