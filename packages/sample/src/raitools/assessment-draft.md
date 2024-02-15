# Section 1: Project Information

## Project profile

**1.1** Complete the project information below.

  -----------------------------------------------------------------------
  Project Name         Orca: Progressive Learning from Complex
                       Explanation Traces of GPT-4
  -------------------- --------------------------------------------------
  Group                Microsoft Research

  Point of contact     Subhabrata Mukherjee
  -----------------------------------------------------------------------

Track revision history below.

  -----------------------------------------------------------------------
  Authors              Subhabrata Mukherjee, Arindam Mitra, Ganesh Jawahar,
                       Sahaj Agarwal, Hamid Palangi, Ahmed Awadallah
  -------------------- --------------------------------------------------
  Last updated         June 5, 2023

  -----------------------------------------------------------------------

Identify the individuals and institutions (including academic) who are
partners, contributors, or reviewers of this project.

  -----------------------------------------------------------------------
  Contributors with    
  affiliations         Microsoft Legal Team for model weight release policy
  -------------------- --------------------------------------------------

  -----------------------------------------------------------------------

## Project components and timeline

**1.2** Please describe the components of your project, including what
you've done so far, what you plan to do, conferences you plan to attend,
current or future partners, and your desired timeline.

**Example:** "We've onboarded and done analysis of two datasets. We
trained a model which we're currently testing in a research study. We're
planning to write a paper and submit it to Neurips. The abstract
deadline is May 11, the paper submission deadline is May 17, and the
supplementary material deadline is May 24. We need to open source the
training code, the trained model, and the dataset by July 15."

  -----------------------------------------------------------------------
  Project description  Orca is a 13-billion parameter model developed to imitate
                       the reasoning process of large foundation models (LFMs),
                       specifically learning from GPT-4's explanation traces and
                       step-by-step thought processes. The project aims to
                       enhance the capabilities of smaller models through
                       imitation learning and rich signal processing. Current
                       progress includes surpassing state-of-the-art instruction-
                       tuned models in reasoning benchmarks and competitive
                       performance in academic examinations. Future plans
                       involve public release of model weights and continued
                       research into learning from explanations.
  -----------------------------------------------------------------------

## Supporting material

**1.3** If you have links to any supplementary information about the
project such as slide decks, demos, or particularly relevant prior work
/ preprints, please include links below. Please also link to any related
R&CT records (consulting, dataset onboarding, user studies, release or
other projects, departing interns) or ERP records.

  -----------------------------------------------------------------------
  Description of supplementary  Link
  information                   
  ----------------------------- -----------------------------------------
  Project Abstract              arXiv:2306.02707v1 [cs.CL] 5 Jun 2023
  Model Weight Release Policy   https://aka.ms/orca-lm
                                
  -----------------------------------------------------------------------

## Project goal and overview

**1.4** Briefly explain, in plain language, what the goal of the project
is. **Do not copy your paper abstract.** Help your peers outside your
area of expertise understand your work. Readers of this document can
drill down by visiting your supplementary links above.

  -----------------------------------------------------------------------
  Project goal and overview     The goal of Orca is to create a smaller AI model that can
                                replicate the complex reasoning abilities of larger models
                                like GPT-4. By learning from detailed explanations and
                                thought processes, Orca aims to provide a more accessible
                                yet powerful tool for AI research and applications, with
                                the potential to perform well in academic and professional
                                settings.
  -----------------------------------------------------------------------

## Relationship to products

**1.5** Briefly describe how this project relates to any Microsoft
systems or products (if applicable). Is it likely for this project to be
integrated into future products? Do you have an existing collaboration
or plans for a collaboration?

  -----------------------------------------------------------------------
  Relation to other products/features  Orca's development aligns with Microsoft's broader
                                       goals of advancing AI capabilities and could potentially
                                       be integrated into future Microsoft products that require
                                       advanced reasoning and language processing. The project
                                       may also contribute to collaborations with academic and
                                       research institutions.
  -----------------------------------------------------------------------

# Section 2: Sharing

## What?

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
