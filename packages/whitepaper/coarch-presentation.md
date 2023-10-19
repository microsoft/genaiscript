# CoArch: Supporting Human/LLM Interaction in Building Complex Artifacts

# Peli de Halleux, Michał Moskal, Ben ZornSeptember 2023

CoArch is short for “co\-architect” to highlight its role in coordination and design

---

CoArch is a synchronization tool that streamlines documentation within software projects. It partitions documents into "fragments" which share common identifiers, thereby creating links. Users can employ either built-in or user-defined semantic macros, which then generate prompts for a Large Language Model (LLM) using these fragments and their respective links. The responses from the LLM are then used to update or create new fragments, ensuring that the documentation remains consistent and current.


# Complex Artifacts Require Complex Processes

modern software repositories requirecomplex processes and dependence hierarchies

Input file: test\.text

automated processes

linear generation\(pipes\, chat sessions\)

tree hierarchies \(makefiles\)

How can AI best support these complex processes?

---

Emphasize not just generation but: review, consistency checking, exploration, etc.Also emphasize this isn’t just about software – any field that has collections of related artifacts can benefit

# Working with AI Beyond Chat Interfaces

* Chat interfaces are powerful
  * ChatGPT instant success
  * Bing Chat
  * Many instances of M365 Copilots
* __But…__
  * Chat is a “bolt\-on” side panel experience
  * Chat doesn’t scale – lack of modularity\, abstraction\, reuse\, etc\.
  * Chat doesn’t envision new AI use scenarios

# CoArch: Supporting Human/LLM Interaction in Building/Maintaining Complex Artifacts

* CoArch is a programming language framework and UI to support human/AI collaboration
* CoArch goals
  * Support creation\, evolution\, and maintenance of complex artifacts\, including ensuring consistency across components
  * Enable new human/AI interactions and experiences
  * First\-class support for human/AI collaboration
  * Promote CoArch prompts as a highly\-tuned\, first\-class SW artifact: can be edited\, reviewed\, shared\, etc\.\, by a team with a wide ranges of skills

---

Talk about limitations of chat (in relation to CoArch)


# AI Requires New Tools and Experiences

* Technology trends inspire new languages and tools
  * GUI applications: C\+\+\, Web applications: JavaScript \, Foundation models: TBD
* New scenarios
  * Creation of multiple\, related documents simultaneously
  * End users creating new tools/utilities for diverse use cases
  * AI\-support design complex artifact design
* Existing experiences and tools don’t account new scenarios

# CoArch at a Glance

Prompt files leverage LLMs to provide reusable tool capabilities

Command files \(in markdown\) describe specific user task

CoArch is a language framework integrated into VS Code to support human/AI collaboration

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee0.png)

Collections of related prompts support diverse workflows

User applies prompt file to \.coarch\.md file to generate LLM result

---

CoArch includes
CoArch commands: markdown files .gpspec.md
CoArch prompts: prompt files 


# Demo 1 – Hello World

Generic \.gptool\.js implements task: writing Python code

User writes markdown to solve a specific problem that in combination with prompt creates an LLM request\.

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee1.png)

Context providedin prompt via “env”references to related user files

Prompts combine freeform text with integrated JavaScript

Links provide references to other data sources

Two files\, the \.coarch\.md and the \.gptool\.js file\, combine to create the request to the LLM

# CoArch Interaction Process

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee2.png)

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee3.png)

Applycodegen prompt

Describecodegentask

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee4.png)

Update

codegentask

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee5.png)

Applycodegen prompt

# Refactor View Supports Human/AI Coordination

Original code did not correctly handle being called with no arguments

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee6.png)

New code fixes this issue

This example illustrates how updating the CoArch command file with additional information leads to changes in the generated code that can be previewed in VS Code

# Coordinating Prompts Example: Generating Unit Tests

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee7.png)

Applying a new prompt to the original file \+ the python code previously generated\, we can now generate unit tests for the previously generated code

# CoArch Supports Hierarchical Decomposition

CoArch Example: Document Writing

CoArch\.md file withpaper abstract

Leverages LLMs capability to decompose tasks into subtasks

Builds refinement tree and allows prompts to operate on it

Supports editing content and/or prompts at any node of the tree

Prompts can be highly engineered but also customized for a specific team or application

DecomposePrompt

ElaboratePrompt

Critical Analysis

# Demo 2 – mywordle - Prompts as Roles

Goal: write Wordle app

Process: describe app at high level in mywordle\.coarch\.md

Define different roles as prompts to apply to mywordle\.coarch\.mdRoles: system architect\, SDE\, QA\, documentation\, etc\.

# Key Properties of CoArch

* Abstraction
  * Clean separation of tools \(prompts\) from application for reuse
  * Commands in markdown direct application of prompts
* Explicit Dependences and Workflow
  * Maintains dependence tree identifying what content was generated from what command \+ prompt
  * Sources represented explicitly in prompts
  * Sequence of prompt applications similar to Unix pipe \(except human in the loop\)
* Allow for LLM failures
  * Support human\-editable LLM outputs
  * Support human oversight\, review\, and maintenance
  * Ease of authoring and customizing prompts for particular task

# Demo 2 – mywordle – System Architect

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee8.png)

System architect prompt decomposes problem into files\, APIs\, etc\.

Writing effective prompts is like writing software\, requires expertise and effort

CoArch supports users with different skills to customize in different ways

# Demo 2 – mywordle – Developer Prompt

SDE prompt generates multiple Python files based on the architect’s specification

![](img%5CCoArch%20Overview%20September%202023%20for%20Peter%20Lee9.png)

# Research Challenges

* Defining abstraction boundary with prompts
  * What to hide from user\, what to expose?
  * Example: Does the user specify the LLM to use \(like “register” decl in C\)?
    * Optimizing LLM use at the CoArch prompt level is a new research area
  * Example: Determining how to fit the most important and necessary context into the window
* Supporting bidirectional consistency automatically
  * Example: edit either problem description or code\, have the other automatically updated for consistency
    * How? User writes reverse prompt?  Automatically generate?
  * How do we define “consistent enough”?
  * Can we achieve acceptable levels of consistency with model nondeterminism?
* Exploring classes of experiences CoArch can support

# Discussion

* CoArch is a general\-purpose framework for defining\, connecting\, and applying related prompts
  * What are good examples of verticals that benefit from this?
* Given CoArch framework\, what are good collections of related prompts?
  * General purpose \(such as review\, check for consistency\, etc\.\)
  * Vertical specific \(what verticals\)?
* How can we leverage CoArch to support important responsible AI properties \(privacy\, security\, etc\.\)

Collaboration across MSR\, Azure HPC\, AI Platform\, Azure ML

# Bigger Picture: MSR AI Inference Stack

__Guided Prompt Constructor__

CoArch:

Consistent Hierarchical\-prompting

Constraint Generators

Memory & Content Retrieval

Disciplined abstractions to enable

cross\-layer optimizations while ensuring

modularity\, programmability\, and portability

Inference Scheduling

AI Frameworks

\(PyTorch\, ONNX\)

Task Orchestration

Compute/Communication Ops

MSCCL\+\+

Fine\-grained Comm

cuSync:

Fine\-grained

Kernel Sync\.

Model Abstraction Layer \(MAL\)

Hardware Abstraction Layer \(HAL\)

# Bigger Picture: FAST Project: The Full AI StackRethinking the Inference-Time Platform

__Secure\, Safe\, and Responsible LLM apps__  _Im_  _prove benchmarks and online metrics_

__Libraries__ :

Numerics\, …

__CoArch__  _Consistency and synchronization _  _across macro\-tasks w/ many prompts_

<span style="color:#A5A5A5"> _Orchestrators and Agents_ </span>

<span style="color:#A5A5A5"> _Semantic Kernel\, _ </span>  <span style="color:#A5A5A5"> _Langchain_ </span>  <span style="color:#A5A5A5"> _\, _ </span>  <span style="color:#A5A5A5"> _MetaGPT_ </span>  <span style="color:#A5A5A5"> _\, …_ </span>

* <span style="color:#0070C0"> __Every disruptive technology requires rethinking the platform__ </span>
  * …\, PC\, Internet\, Cloud\, Mobile
* Driving trends:
  * <span style="color:#0070C0">Users want higher\-level macro\-tasks</span>
    *   _Many stakeholders_  must coordinate
  * <span style="color:#0070C0">Monolithic LLMs challenge separation of concerns and have fundamental limits</span>
    * Weakest stakeholder breaks security\, safety\, and other RAI concerns
    * We have to design for AI failures
  * <span style="color:#0070C0">Limited by GPU performance and avail\.</span>
    *  Co\-design and optimization across stack

__Core Guidance__

_Single _  _prompt guided decoding_

__Constraint providers __

_Enforce hard and soft spec_

__Cloud Guidance __

_Secure execution and _  _low\-level acceleration_

---


Users want higher-level macro tasks - this is a strong contrast to recent trends in mobile apps

Monolithic LLMs, where all functional concerns are managed through prompting and finetuning puts too much pressure on every stakeholder to build their AI component perfectly.  
We must design assuming failure; and separate the complexity and hardest problems into dedicated infrastructure that will enforce correctness even when others fail.  
We must also do this while preserving the flexibility that LLMs provide

GPU efficiency and availability must be paramount.  This means that the most expensive tasks across the stack must be co-designed with low-level optimizations.  


# Next Steps

Get more experience with CoArch\, engage with initial users

Explore approaches to ensuring consistency of related content

Consider additional automation \(e\.g\.\, rerun sequence of prompts\, batch automation of consistency checking\)

Explore integration into experiences beyond VS code \(e\.g\.\, Office\)

# Related Documents

[CoArch](https://microsoft-my.sharepoint.com/:w:/p/zorn/EbgVeZHkSSVHtVAhm6Bb8GcBSaqYK3_KCKrI27rUdEEBWw?e=HJuArs)[ repo: ](https://microsoft-my.sharepoint.com/:w:/p/zorn/EbgVeZHkSSVHtVAhm6Bb8GcBSaqYK3_KCKrI27rUdEEBWw?e=HJuArs)[microsoft/](https://github.com/microsoft/coarch)[coarch](https://github.com/microsoft/coarch)[: ](https://github.com/microsoft/coarch)[CoArch](https://github.com/microsoft/coarch)[ \- Refinement Copilot \(github\.com\)](https://github.com/microsoft/coarch)

[CoArch](https://microsoft-my.sharepoint.com/:w:/p/zorn/EbgVeZHkSSVHtVAhm6Bb8GcBSaqYK3_KCKrI27rUdEEBWw?e=HJuArs)[ \- Trusted Natural Language Software Development May 2023\.docx](https://microsoft-my.sharepoint.com/:w:/p/zorn/EbgVeZHkSSVHtVAhm6Bb8GcBSaqYK3_KCKrI27rUdEEBWw?e=HJuArs)

[Problems with Chat AI Interfaces June 2023\.docx](https://microsoft-my.sharepoint.com/:w:/p/zorn/EciWhXZqbgJGpXLj7A9N0u0BDoYAhakq421zxwHcYAAQTg?e=3Oz4Tn)

# Backup

# How Does CoArch Relate to…?

* Guidance – Guidance defines a language for a single prompt and CoArch defines a way to connect a set of related prompts and task descriptions
  * Similarly\, TypeChat addresses controlling input/output with a single prompt
* Semantic Kernel – SK defines skills \(functions implemented as LLM calls\)\, which relate to CoArch prompts\, but does not define a user experience to coordinate them or enable scenarios where non\-professonial developers can benefit from them
  * Similarly for langchain
* Flux/Sydney – Orchestrators support scenarios with multiple SW/LLM interactions but don’t expose the coordinate of the interaction directy to a user for oversight/input
  * These runtimes are intended to be used to build LLM\-enabled applications but not to support creating a wide ecosystem of users that contribute prompts

# Goal: Build a complex artifact (doc, repo, etc)Problem: Chat Interfaces are Inappropriate

* Chat is linear and does not scale
  * No hierarchical decomposition
  * Train of consciousness structure
  * Difficult to share\, lacks modularity and abstraction
  * Not integrated into the artifact it is used to create
* What does an alternative look like?  Some requirements:
  * Description of the entities involved \(presumably at least the user\, Copilot\, the LLM\, and the artifact\)
  * Elements that express human intent
  * Descriptions of tasks that the Copilot can do to aid the user \(via prompts\)
  * Recursive\, hierarchical structure
* For more details\, see: [Problems with Chat AI Interfaces June 2023\.docx](https://microsoft-my.sharepoint.com/:w:/p/zorn/EciWhXZqbgJGpXLj7A9N0u0BDoYAhakq421zxwHcYAAQTg?e=G8O6Sw)

# New Features and Generizations

* Prompts are currently implemented via LLM\, but could be arbitrary scripts
* Prompt language is currently text \+ some JavaScript substitution
  * Could benefit from more sophisticated language like Guidance
* Need more expressive way to identify and input context and sources \(files\, URLs\, search results\, DB\, etc\.\) for RAG
* Need summarization capabilities to match size of context input with LLM window size

