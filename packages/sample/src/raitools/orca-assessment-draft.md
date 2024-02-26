# Draft Impact Assessment for Orca Project

## Section 1: Project Information

### Project profile

**1.1** Complete the project information below.

| Project Name         | Orca: Progressive Learning from Complex Explanation Traces of GPT-4 |
|----------------------|--------------------------------------------------------------------|
| Group                | Microsoft Research                                                  |
| Point of contact     | Subhabrata Mukherjee                                                |

**Authors:** Subhabrata Mukherjee, Arindam Mitra, Ganesh Jawahar, Sahaj Agarwal, Hamid Palangi, Ahmed Awadallah  
**Last updated:** June 5, 2023

**Contributors with affiliations:** Microsoft Research

### Project components and timeline

**1.2** The Orca project is a research initiative aimed at enhancing the capabilities of smaller AI models by leveraging the reasoning processes of Large Foundation Models (LFMs) like GPT-4. The project has involved the development of a 13-billion parameter model that learns from rich signals including explanation traces and step-by-step thought processes. The project has reached the stage where Orca has demonstrated competitive performance on benchmarks such as BigBench Hard and professional exams like SAT, LSAT, GRE, and GMAT. The project aims to publicly release a diff of the model weights in accordance with LLaMA’s release policy.

### Supporting material

**1.3** Supplementary information about the project can be found in the research paper draft and the project's GitHub repository. Links to these resources will be provided upon their public release.

### Project goal and overview

**1.4** The goal of the Orca project is to develop a smaller AI model that can imitate the reasoning process of LFMs like GPT-4, thereby enabling it to perform complex reasoning tasks with high accuracy. The project seeks to address the challenges of limited imitation signals and evaluation protocols that overestimate small models' capabilities.

### Relationship to products

**1.5** While Orca is primarily a research project, its methodologies and findings have the potential to influence future Microsoft products that utilize AI models for complex reasoning tasks. The project's insights could lead to more efficient and scalable AI systems within Microsoft's suite of tools and services.

## Section 2: Sharing

### What?

**2.1** At this milestone, we are planning to share the following assets:
- Research paper
- Model weights (diff)
- Training and evaluation datasets

### Who?

**2.2** The assets are being shared with:
- Open Source/Public
- Research community
- Potential collaborators

### Why?

**2.3** Our goals for sharing these assets are to:
- Contribute to the advancement of AI research
- Foster collaboration within the AI research community
- Demonstrate Microsoft's commitment to responsible AI practices

## Section 3: Data information and considerations

### Data documentation

**3.1** The datasets used for training Orca, including FLAN-5M and FLAN-1M, are documented in the project's GitHub repository. The data collection process followed the guidelines provided by Azure OpenAI service.

### Data reflections

**3.2** The data used for training Orca includes a diverse set of tasks and instructions, which helps mitigate biases that may arise from a limited dataset. However, the data's diversity also means that Orca's performance may vary across different tasks.

## Section 4: Project impacts and limitations

### Impacts of sharing

**4.1** Sharing Orca's methodology and findings will contribute to the broader AI research community by providing insights into the training of smaller models with LFMs. It will also showcase Microsoft's research capabilities and commitment to developing AI responsibly.

### Known limitations

**4.2** Orca's performance is dependent on the quality and diversity of the training data. The model may not perform as well on tasks that are underrepresented in the training dataset. Additionally, Orca inherits the limitations of its teacher model, GPT-4, including potential biases present in the data used to train GPT-4.

### Risks of sharing

**4.3** If misused, Orca could potentially generate biased or harmful content. The most obvious abuse scenarios include the generation of disinformation or the use of the model to automate tasks in a way that violates ethical standards.

**4.4** Unintentional misuse of Orca could occur if it is used in scenarios for which it was not designed, leading to inaccurate or nonsensical outputs.

### Mitigations for immediate risks

**4.5** We intend to use the following mitigations for risks identified:
- Providing a comprehensive research paper that outlines the limitations and intended use cases of Orca.
- Releasing model weights with clear documentation on how to use them responsibly.
- Monitoring the use of Orca in the open-source community and addressing any abusive patterns that emerge.

## Section 5: Thinking into the future

### Possible real-world uses

**5.1** Real-world uses of Orca could include applications in natural language processing where complex reasoning is required, such as legal analysis, academic research, and advanced customer service bots.

### Possible real-world misuses

**5.2** Potential misuses of Orca include its deployment in creating sophisticated bots that could engage in deceptive practices or its use in automating tasks in a manner that could lead to job displacement.

### Stakeholders

**5.3** Stakeholders impacted by Orca include researchers, developers, and end-users who interact with AI systems that require complex reasoning abilities.

### Intended Uses

**5.4** The intended use cases for Orca are in research settings where understanding and improving AI reasoning capabilities are the primary focus.

**5.5** Stakeholders most impacted by Orca include the AI research community, developers of AI applications, and organizations that rely on AI for decision-making processes.

**5.6** Orca is best suited for use cases where complex reasoning and understanding are required, such as academic research and development of advanced AI systems.

### Harms and mitigations

**5.7** Anticipated harms to stakeholders include the potential propagation of biases and the generation of inaccurate information. Mitigations include thorough documentation, clear communication of the model's limitations, and active monitoring of its use in real-world applications.

**2.1** What assets are you planning to share at the point of the
milestone we're reviewing now? (Check all that apply)

☐ demo

☐ source code

☐ model(s)

☐ data

☐ project webpage

☐ paper

☐ other (Explain)

## Who?

**2.2** Who are you sharing with? (Check all that apply)

☐ Open Source/Public

☐ paper reviewers

☐ customer(s) (please list)

☐ partners (please list)

☐ product teams (please list)

☐ other (please describe)

## Why?

**2.3** What are your goals for sharing these assets now? (Check all
that apply)

☐ Share with research community for replication to support a publication

☐ Share with partner to support collaboration

☐ Share with public to generate excitement for this work/MS

☐ Other reason (please describe)

# Section 3: Data information and considerations

## Data documentation

**3.1 REMINDER:** If you have any dataset onboarding records, user study
records in which you gathered data, or additional data documentation
(git hub docs, readmes, description in your paper), please link to these
under section 1.3 above.

## Data reflections

**3.2** Brainstorm the top 1-5 impacts that the makeup of your data
could have on your work. Find seed questions here:
[aka.ms/tnrdataquestions](aka.ms/tnrdataquestions)

  -----------------------------------------------------------------------
  Impacts of data makeup       The data makeup could impact the model's ability to
                               generalize across different tasks and domains. It is
                               crucial to ensure diversity and representativeness in
                               the data to avoid biases and limitations in the model's
                               reasoning capabilities.
  -----------------------------------------------------------------------

# Section 4: Project impacts and limitations

## Impacts of sharing

**4.1** Please describe what impact successful sharing will have on your
work, your field of research, and Microsoft.

  -----------------------------------------------------------------------
  Impacts of sharing the AI technology  Sharing Orca's technology could significantly
                                        advance the field of AI by demonstrating the
                                        potential of smaller models to perform complex
                                        reasoning. It could also reinforce Microsoft's
                                        position as a leader in responsible AI development.
  -----------------------------------------------------------------------

## Known limitations

**4.2** Reflecting on your data (see 3.2 above) and your techniques,
what are the current limitations of the system? This could include
scenarios where the system will not perform well (e.g., a language
system being use in a natural language that is not supported, or an
image generation tool what works better for scenery then for images of
humans), environmental factors to consider (lighting for images, or
background noise for audio recordings), or other factors to be aware of.

  -----------------------------------------------------------------------
  Known limitations             Orca may have limitations in understanding and reasoning
                                in languages other than those it has been trained on.
                                Additionally, the model's performance may vary across
                                different domains and types of reasoning tasks, which
                                could limit its applicability without further fine-tuning.
  -----------------------------------------------------------------------

## Risks of sharing

**4.3** If a malicious entity were to use the assets you share, what
could happen? What are the most obvious abuse scenarios? What could go
wrong? Will anyone be hurt? In what ways?

  -----------------------------------------------------------------------
  Abuse risks                   If Orca's model weights or reasoning capabilities were
                                misused, it could lead to the generation of harmful or
                                misleading content, potentially causing misinformation
                                or other negative societal impacts.
  -----------------------------------------------------------------------

**4.4** Is it possible for your assets to be misused unintentionally?
For example, by a non-familiar or novice user or used in an operational
environment that the system was not designed for? What could go wrong?
Will anyone be hurt? In what ways?

  -----------------------------------------------------------------------
  Unintended use risks          Unintentional misuse could occur if Orca is applied in
                                contexts it was not designed for, such as high-stakes
                                decision-making without human oversight. This could
                                lead to errors with potentially serious consequences.
  -----------------------------------------------------------------------

## Mitigations for immediate risks

**4.5** Check all mitigations you intend to use for risks identified and
add any additional mitigations in the box provided.

Limiting open release:

> ☐ Not releasing code/models/data
>
> ☐ Providing a mitigated demonstration web site in lieu of releasing
> high risk models/code/data publicly
>
> ☐ Leveraging a process similar to the [ACM artifact evaluation
> process](https://conferences.sigcomm.org/sigcomm/2021/cf-artifacts.html)
> -- i.e., providing code/models/data specifically to reviewers without
> public release
>
> ☐ Gating the public release through an email/form to the team

Monitor use for abuse:

> ☐ Releasing in such a way that usage can be tracked
>
> ☐ Actively setting up alerts and escalations when abusive patterns are
> discovered

Clear and complete transparency documentation:

> ☐ Ethics and Responsible AI statements in paper
>
> ☐ Model card
>
> ☐ Transparency note
>
> ☐ RAI section in product documentation
>
> ☐ RAI information in blogs and other messaging (please describe):
> \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
>
> ☐ Any limitation of release should clearly state the RAI reasoning for
> not sharing the technology openly
>
> ☐ Clearly communicates the intention of use only in research settings
>
> ☐ Content moderation (please describe):
> \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
>
> ☐ Prompt engineering
>
> ☐ Code of conduct
>
> ☐ Research only license
>
> ☐ Other:

# Section 5: Thinking into the future

## Possible real-world uses

**5.1** List the most likely real-world uses of the research project.
What might happen when this research leaves the lab and moves forward?
Are there characteristics of your technique that make it particularly
well suited for particular use cases?

  -----------------------------------------------------------------------
  Real-world use          Description
  ----------------------- -----------------------------------------------
  Educational Tools       Orca could be used to develop advanced tutoring
                          systems that provide step-by-step explanations to
                          complex problems, enhancing learning experiences.

  Content Creation        The model could assist in generating creative and
                          technical content, potentially streamlining workflows
                          in various industries.
                          
  -----------------------------------------------------------------------

## Possible real-world misuses

**5.2** List the most likely real-world misuses of the research project.
What might happen when this research leaves the lab and moves forward?
Where is it likely to be misused or potentially abused. Think like a
novice and an attacker?

  -----------------------------------------------------------------------
  Real-world misuse/abuse Description
  ----------------------- -----------------------------------------------
  Disinformation          Orca could be used to generate plausible yet
                          false narratives or content, contributing to
                          misinformation spread.

  Cheating in Academia    The model's ability to solve complex problems
                          could be misused for cheating in educational
                          settings.
                          
  -----------------------------------------------------------------------

## Stakeholders

**5.3** instructions...

  -----------------------------------------------------------------------
  Stakeholders            Description
  ----------------------- -----------------------------------------------
  Researchers             Researchers in AI and related fields would be
                          stakeholders interested in the technical
                          advancements and applications of Orca.

  Educators and Students  This group would be impacted by Orca's potential
                          use in educational tools and environments.
                          
  General Public          As potential end-users of applications powered by
                          Orca, the public has a stake in the responsible
                          development and deployment of the technology.
  -----------------------------------------------------------------------

## Intended Uses

**5.4** What are the intended use cases for this work?

  -----------------------------------------------------------------------
  Intended use cases      Description
  ----------------------- -----------------------------------------------
  Research and Innovation Orca is intended to push the boundaries of AI
                          research and foster innovation in the field.

  Educational Enhancement The model is designed to enhance educational
                          tools and resources through advanced reasoning
                          capabilities.
                          
  Content Generation      Orca aims to assist in various forms of content
                          creation, from academic to creative writing.
  -----------------------------------------------------------------------

**5.5** Who are the possible stakeholders that would be most impacted by
both your research and the future real world uses?

  -----------------------------------------------------------------------
  Stakeholders            Description
  ----------------------- -----------------------------------------------
  AI Researchers          Researchers would be directly impacted by the
                          advancements in model capabilities and potential
                          new research directions.

  Educators and Students  This group would experience the benefits and
                          challenges of integrating Orca into educational
                          tools and curricula.

  Content Creators        Professionals in content creation fields could see
                          changes in their workflows and the nature of their
                          work due to Orca's capabilities.
  -----------------------------------------------------------------------

**5.6** Which use cases and stakeholders is this work best suited for?
Why?

  -----------------------------------------------------------------------
  Best use case/stakeholder scenarios  Description
  ----------------------------------- -------------------------------------
  Academic Research                    Orca is particularly suited for
                                       academic research due to its ability
                                       to process and generate complex
                                       explanations, aiding in the
                                       understanding of AI reasoning.

  Educational Applications             The model's explanatory capabilities
                                       make it well-suited for educational
                                       applications, where understanding
                                       the reasoning behind answers is
                                       crucial.
  -----------------------------------------------------------------------

## Harms and mitigations

**5.7** After reflecting you your real-world use cases, stakeholders and
data, what are the anticipated harms to stakeholders and how can the
identified harms be mitigated? Some mitigations may serve for more than
one stakeholder and use case.

  ------------------------------------------------------------------------
  Stakeholders/Use Case Potential harms            Potential mitigation
  --------------------- -------------------------- -----------------------
  General Public         Misinformation and        Implementing robust
                         manipulation through      content moderation and
                         generated content         verification systems.

  Students               Dependence on AI for      Encouraging critical
                         problem-solving           thinking and providing
                                                    clear guidelines for AI
                                                    tool use in education.

  Content Creators       Job displacement due to   Offering retraining and
                         automation                upskilling programs to
                                                    adapt to new technologies.
  ------------------------------------------------------------------------

## Feedback on the Impact Assessment

Thank you! We would like to hear about your experience completing an
Impact Assessment. Please follow [**this
link**](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR23RB60UBK9BjmEIqZ0hN5NUNUZRMTVYUlBVNk1XM0tHUzBDTzJRUUdLUiQlQCN0PWcu)
to complete a short survey.
