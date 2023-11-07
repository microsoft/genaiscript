# Generative AI Plugin Responsible AI Evaluation
  LASER GAP Working Group
  August 15, 2023

# Contents {#contents .TOC-Heading}

[Executive Summary [2](#executive-summary)](#executive-summary)

[Background [5](#background)](#background)

[Summary of Risks, Harms, and Areas of Investigation
[7](#summary-of-risks-harms-and-areas-of-investigation)](#summary-of-risks-harms-and-areas-of-investigation)

[Area of Investigation: Adversarial actors
[9](#area-of-investigation-adversarial-actors)](#area-of-investigation-adversarial-actors)

[Area of Investigation: Fairness-Related Allocation Harms
[18](#area-of-investigation-fairness-related-allocation-harms)](#area-of-investigation-fairness-related-allocation-harms)

[Area of Investigation: User Perspectives
[22](#area-of-investigation-user-perspectives)](#area-of-investigation-user-perspectives)

[Area of Investigation: Privacy and Confidentiality Risks
[29](#area-of-investigation-privacy-and-confidentiality-risks)](#area-of-investigation-privacy-and-confidentiality-risks)

[Area of Investigation: Accountability and Control with Multiple
Stakeholders
[35](#area-of-investigation-accountability-and-control-with-multiple-stakeholders)](#area-of-investigation-accountability-and-control-with-multiple-stakeholders)

[Area of Investigation: Risks due to Adaptive Automation at Scale
[41](#area-of-investigation-risks-due-to-adaptive-automation-at-scale)](#area-of-investigation-risks-due-to-adaptive-automation-at-scale)

[Area of Investigation: Specification and Testing Challenges
[48](#area-of-investigation-specification-and-testing-challenges)](#area-of-investigation-specification-and-testing-challenges)

[Area of Investigation: Security Management Practices
[55](#area-of-investigation-security-management-practices)](#area-of-investigation-security-management-practices)

[Next Steps [59](#next-steps-1)](#next-steps-1)


# Executive Summary

We evaluated the responsible AI
risks and harms associated with combining foundation models[^1] with
software extensions. These extensions allow LLMs to impact the world
beyond conversations, such as researching, recommending, and purchasing
products or services; performing calculations; and even managing cloud
infrastructure. This report is written to guide Microsoft's responsible
deployment of plugin-enabled Copilots and other LLM-based applications.

LLM and multi-modal model advancements offer various novel,
general-purpose AI capabilities, but integration with broader software
is essential for key scenarios. Combining LLMs with information
retrieval services (like Bing Chat) grants access to up-to-date
knowledge, real-time data, and private or proprietary information. These
extensions enhance grounding, reduce hallucinations, and augment LLMs'
computational and memory capabilities. Integrations with the wider
software ecosystem also allow LLMs to perform direct action---such as
sending emails, buying products, and controlling devices.

Software extensions and the scenarios they enable create new risks and
exacerbate existing ones that cannot be fully mitigated with current
technologies. Our working group, comprising of leading research and
engineering experts in AI and LLMs, software engineering, responsible
AI, user experience, and policy, investigated LLM-plugin risks through
proof-of-concept experiments, manual explorations, a user study, and
other grounded analyses. This report describes the risks we uncovered.

Risk scenarios that were of high importance and require immediate action
are labeled as critical. [The critical risk scenarios we identified
are]{.underline}[^2]:

**C.S.1. Security: Unauthorized command execution through cross user
prompt injection attacks (XPIA)**

Current LLMs technologies process all inputs through a single, combined
text input, and thus have difficulty distinguishing commands from data
and distinguishing information coming from different sources. As a
result, 3^rd^-parties can smuggle commands into the system (e.g., via
plugins) and the LLM can be fooled into following them, using the user's
credentials for malicious purposes.\
Additional Details: Area of Investigation: Adversarial actors

**C.F.1. Fairness: Unfair decisions affect user access to plugins and
resources\
**In many scenarios, LLMs mediate user access to plugins and resources.
We find that LLMs can make decisions that are systematically unfair to
groups of users when deciding what plugins should be used, and what
resources (products, services, etc.) are a best match to a user and
their needs.**\
**Additional Details: Area of Investigation: Fairness-Related Allocation
Harms

**C.P.1. Privacy: LLMs leak user data to plugins without consent**

Upon request from a plugin's API or iterative interaction, an LLM may
provide any information it has access to, without user permission or
knowledge. This is a significant privacy risk, as it can expose private
or confidential information to untrusted 3^rd^ parties. This risk
extends to sharing sensitive information that an LLM may know
implicitly, infer, or hallucinate.

Additional Details: Area of Investigation: Privacy and Confidentiality
Risks [\
]{.underline}

**C.R.1. Overreliance: People assume plugins make LLMs trustworthy**

In user studies we conducted, we found that people assume plugins remedy
LLM limitations---for example, that the use of the WolframAlpha plugin
means that LLMs *cannot* make arithmetic mistakes, or that the use of
the Lexus Nexus plugin means that legal citations would always be
accurate. A lack of understanding, education, and documentation about
LLM+plugin systems exacerbate overreliance issues.

Additional Details: Area of Investigation: User Perspectives

We identified additional high- and medium-risk scenarios related to
security, privacy, fairness, reliability and safety, accountability, and
transparency and describe each in our detailed report.

## Next Steps

We recommend:

1.  **Technical mitigations in our platform**---independent of specific
    foundation models. Microsoft is well-positioned to define and
    implement mitigations with deep experience related to ensuring
    privacy, security, etc. in our platforms. While our understanding of
    both the risks and mitigations are still immature, we can help
    establish important responsible AI standards of excellence and
    related policy recommendations and provide leadership going forward.

2.  **Product-specific investigations and coordination of efforts:** We
    recommend robust investigations into each of the risks above in the
    context of each of our major Copilot products and underlying
    platforms. We expect many issues and mitigations to require
    coordination across a number of teams and recommend assigning a
    single DRI for each major product for accountability and consistency
    in methods and evaluation.

3.  **Collaboration with LLM providers and the broader technical
    community to investigate and improve foundation models to reduce
    these risks.** We envision that the most effective mitigations will
    involve a richer interaction between the LLM and the copilot hosting
    it than current APIs provide. Actively collaborating with LLM
    vendors to improve LLM awareness of RAI issues with plugins and
    define and implement these enriched APIs will help reduce risks.
    Further, we recommend developing a common understanding and taxonomy
    for classifying plugin capabilities and risks, including best
    practices for defining plugin manifests, that is shared across the
    community.

4.  **Workstreams to create policy and process mitigations** to ensure
    safety of our products. Different vertical applications of LLMs with
    plugins will require different mitigations and processes but to the
    extent possible, coordinating these efforts across different product
    workstreams is necessary to ensure a uniform and high product
    quality across verticals.

One very important take-away from our study is that improving the
capabilities of the LLM alone is insufficient to mitigate risks raised
by LLMs calling plugins. **Mitigations built into the orchestration
framework that the LLM is part of (such as Sydney/Flux/Semantic Kernel
and other Copilot frameworks) will be critical in reducing the potential
harms of GAP systems.**

[Additional dynamics]{.underline}

We foresee additional dynamics that will impact the user experience,
though it is not yet clear whether their impact will be positive or
negative:

**User impatience with friction will make human-in-the-loop mitigations
less acceptable:** Our user study finds people questioning why LLMs
require them to enable plugins, rather than allowing the LLM to choose
automatically. Many of our current mitigations rely on human-in-the-loop
approaches that place a burden on the user. We expect that such
mitigations will be acceptable for only a short period of time. ***We
recommend that we carefully balance our RAI mitigation strategies based
on human intervention against the burden that those methods place on the
user.***

**Plugin developers will optimize for LLM engagement with their
plugin.** If plugin monetization relies on an LLM bringing requests,
traffic, or other attention to a plugin, then developers will optimize
for LLM engagement, akin to SEO and user engagement optimization. This
may include "clickbait," promises of valuable information, and other
tactics that may misalign with user interests. ***We recommend a deeper
analysis to inform business models and economic incentives for
plugins.***

**Plugins will be implemented as LLMs that dynamically generate
code**[^3]**.** LLM extensions being dynamically and automatically
generated creates scenarios and potential risks & harms beyond the scope
of this LASER study. ***We recommend a separate LASER study be
commissioned on LLMs and responsible AI concerns of dynamic, automated
code generation**.*

**Open-source implementations of LLM models and Copilots/orchestrators
will potentially run locally and bypass controls suggested in this
document.** To avoid being bypassed, RAI mitigations must present
developers with a clear and positive cost-benefit trade-off. Also, to
protect against adversarial usage of LLMs+Plugins, we must rely on
defensive mitigations within our and our partners' infrastructures.

We welcome feedback on this report and look forward to continued
collaboration across the company and industry on frameworks and
approaches to mitigate the risks and potential harms of LLM plugins.

# Background

There are many potential ways to extend LLM capabilities with software.
We focus on the rising "plugin" paradigm of extensions, described
alternately as tools, skills, functions, and APIs, that have the
following defining properties: (1) the extension is explicitly defined
and described, sometimes abstractly, as part of the LLMs input; and (2)
the LLM is explicitly in control of deciding when and how to use the
extension. Furthermore, in most cases, a response from the extension is
fed back into the LLM for subsequent processing. This model of plugins
is part of Microsoft's Copilot architectures, including Bing, M365, and
Windows Copilots; supported as plugins in ChatGPT, tools in LangChain,
and native skills in Semantic Kernel. Such extensions may be executed as
remote REST APIs or as local functions; and be implemented by 1^st^
party or 3^rd^ parties.

## How Do Plugins Work?

LLMs by themselves have significant weaknesses, such as inability to
generate responses about events that occurred after they were trained.
This study focuses on methods to augment LLMs with additional software,
and in particular the use of plugins, to address these limitations. The
creation of Bing Chat, which gave the OpenAI LLM the capability to
leverage search as part of its processing, was the first widely deployed
example of such a system. Figure 1 illustrates how a platform, labeled
Copilot, can be used to combine LLMs and plugins. Bing Sydney is one
example of such a platform. A typical example of how the Copilot
connects the LLM to the plugins is illustrated. The Copilot provides the
LLM with the user query and additional context, including what plugins
are available to use. The LLM then determines if any of the available
plugins would be valuable in answering the query (e.g., using
Chain-of-Thought reasoning) and tells the Copilot what plugin to call
and what the parameters should be. The Copilot then calls the plugin and
returns the result back to the LLM with the previous context and the LLM
continues to execute its plan, which might include additional calls to
the same or different plugins. When the LLM decides that the query has
been answered, it returns the result to the user.

Building RAI GAP systems will require defining policies and adding
appropriate controls at the boundaries between the Copilot, the LLM, and
the plugins. A key element of the Copilot platform, which is likely to
be application agnostic, is the planner or orchestrator, which is
responsible for coordinating the interactions between the LLM and the
plugins. At Microsoft, efforts are being made to unify our AI efforts
with a single orchestrator, Flux, to provide a single platform on which
to implement the RAI controls discussed in this document.

![](media/image1.png){width="6.040277777777778in"
height="1.5868055555555556in"}

Figure : Data and control flow during LLM + plugin execution.

Classifying What Plugins Can Do

Plugins exist for many different purposes and each purpose can be
classified in terms of what information the plugin needs from the LLM,
what information the plugin provides to the LLM, and what additional
actions that plugin can take or impact it can have beyond the direct
interaction with the LLM. For the sake of clarity, we enumerate these
categories and give examples:

-   **External Information Provider**: Plugin provides external
    information to the LLM (termed Retrieval Guided Augmentation). Also
    called "read-only" plugins.

    -   Example: Bing Chat uses search to give the LLM additional
        context

```{=html}
<!-- -->
```
-   **Internal Information Consumer:** Plugin requires internal
    information that the LLM has access to (like M365 Graph) and LLM
    acts as gatekeeper to determine what to share with the plugin. Every
    plugin consumes some information provided by the LLM, but some
    plugins require access to organization data sources that the LLM can
    access that are subject to compliance rules.

    -   Example: Plugins to Teams Copilot may need access to the meeting
        content

```{=html}
<!-- -->
```
-   **Internal Memory Provider**: Plugin can store/recall information
    shared with it (providing "memory" to LLM) but does not share any
    information beyond returning it to the LLM.

    -   Example: External memory can allow LLMs to retain knowledge of
        interactions beyond the current session.

-   **External Actuator**: Plugin can take actions with side effects
    (I/O, network communication, etc.) with different scopes (for
    example, only visible to LLM; visible to the user such as sending a
    notification; visible to an organization such as sending internal
    mail; or visible to the world such as sending an email to anyone).

    -   Example: Teams Copilot sending a summary of a meeting to all the
        participants in the meeting after it is concluded.

The risks and potential harms described in this document relate directly
to what a particular plugin can or can't do and what mitigations exist
to control it. As a result, clarity on plugin capabilities is necessary.

How Are LLMs with Plugins Different than LLMs Alone?

There have been many investigations and mitigations already applied to
reduce the harms of LLMs alone. With that in mind, the focus of our
report is on how the addition of plugins exacerbates existing possible
LLM harms and creates new ones. Contributing to the new risks are 5 key
factors that differentiate plugin-enabled LLM scenarios from both the
use of LLMs alone or the use of existing software without LLMs:

1.  **Plugins allow real-world actions and consequences:** Existing
    challenges of LLM reliability, fairness, and security are
    exacerbated by the fact that LLM errors can now cause actions to be
    taken by plugins, as discussed above via External Actuator plugins.

2.  **LLMs mix streams of commands and data:** LLMs process all inputs
    as a single, combined text input, struggling to distinguish commands
    from data, and differentiate information from various sources (user,
    system, plugins, and sources connected via plugins).

3.  **LLMs are involved in multi-party interactions:** Plugin-enabled
    application scenarios involve multiple parties (the user, the
    Copilot, the LLM, and one or more plugin services). These
    interactions introduce questions of trust boundaries and
    misalignment of incentives.

4.  **LLMs struggle with enforcing hard constraints:** This fundamental
    inability leads to reliability and safety challenges raising
    significant responsible AI, software engineering, accountability and
    transparency issues, discussed at length in this document.

5.  **Stakeholders may have incorrect or miscalibrated mental models of
    LLMs and plugins:** Misperceptions of stakeholders, including users,
    plugin developers, etc. can cause overreliance on plugins,
    exacerbating responsible AI harms.

# Summary of Risks, Harms, and Areas of Investigation

## Areas of Investigation (AOI)

We selected 8 areas of investigation representing (1) key responsible AI
considerations and (2) fundamental differences in plugin-enabled LLM
scenarios. Each area was investigated by a subgroup of 2-4 experts who
identified multiple risk scenarios via a wide variety of methods,
including proof-of-concept experiments with plugin-enabled LLMs, manual
explorations of LLM and plugin behaviors, a study of user experiences
with ChatGPT plugins, and other grounded analyses. We describe details
of our methods and the risks we identified in the detailed areas of
investigation in this report and its supplementary materials. In
creating this report, we coalesced similar risk scenarios when
identified by multiple investigations.

-   **Adversarial actors:** We focus
    on scenarios that include malicious actors (e.g., plugins, the LLM
    itself).

-   **Fairness:** LLMs become responsible for
    ensuring fair access when users utilize real-world services through
    them.

-   **User perspectives:** We perform a user study to identify RAI risks and UX
    issues during users\' discovery, installation, selection, and use of
    LLM plugins.

-   **Privacy and confidentiality:** Personal LLM agents might provide private data to
    third-party plugins without considering its importance.

-   **Multiple stakeholders:**
    Integrating third-party plugins or multi-user workflows requires
    reconciling potentially conflicting goals among stakeholders.

-   **Adaptive automation:** We
    investigate responsible AI issues arising from users leveraging easy
    automation and personalized large-scale API and plugin usage.

-   **Specification and testing:** We question the testability of extensions and
    plugins, especially when implemented via LLMs, and the reliability
    of combining them in novel ways.

-   **Security management practices**: We examine if enabling LLMs introduces design
    decisions that hinder implementing effective security processes.

## Risks and Harms Identified

We index issues here by their severity (C=Critical, H=High, M=Medium)
and their RAI area. Medium and High severity issues were identified
based on the significance of potential harms, the breadth of scope of
the issue, and whether or not the risk is easily mitigated by existing
methods. Critical issues are issues that require immediate action.
Medium severity issues are listed in individual areas of investigation,
but omitted here.

\* H.S.4 and H.R.2 are marked as High severity but may be considered
*critical* *in* *enterprise settings*.

  --------------------------------------------------------------------------------------------
              RAI Area         Issue                        Priority       AOI
  ----------- ---------------- ---------------------------- -------------- -------------------
  **C.S.1**   **Security**     **Unauthorized command       **Critical**   **Adversarial
                               execution through cross user                Actors**
                               prompt injection attacks                    
                               (XPIA)**                                    

  H.S.1       Security         LLM may choose to trust an   High           Adversarial Actors
                               adversarial plugin                          

  H.S.2       Security         Request forgery when         High           Adversarial Actors
                               multiple plugins are                        
                               activated in one chat                       

  H.S.3       Security         LLMs with plugins can        High           Adversarial Actors
                               automate and scale malicious                
                               attacks                                     

  H.S.4       Security         Current LLMs cannot enforce  High^\*^       Security mgt
                               strong isolation boundaries.                practices

  **C.F.1**   **Fairness**     **Unfair decisions affect    **Critical**   **Fairness**
                               user access to plugins and                  
                               resources**                                 

  H.F.1       Fairness         Impact on plugin developer   High           Fairness
                               and/or resource owner due to                
                               LLM choices                                 

  **C.R.1**   **Reliability &  **People assume plugins make **Critical**   **User
              Safety**         LLMs reliable, exacerbating                 perspectives, spec
                               overreliance**                              and testing**

  H.R.1       Reliability &    Misaligned plugin calls risk High           Multi-party / Spec
              safety           unintended actions                          & testing

  H.R.2       Reliability &    Challenges ensuring that     High^\*^       Adaptive Automation
              Safety           data contracts exist and are                
                               enforced                                    

  H.R.3       Reliability &    Automation+plugins compounds High           Adaptive Automation
              Safety           risks of hallucination                      / spec & testing

  H.R.4       Reliability &    Plugins scraping blocked /   High           Adaptive Automation
              Safety           unknown content                             

  H.R.5       Reliability and  Unit testing is not enough   High           Specification and
              Safety           to ensure robust or reliable                testing
                               operation                                   

  **C.P.1**   **Privacy**      **LLM leaks private or       **Critical**   **Privacy and
                               confidential data to plugins                Confidentiality**
                               without consent or prior                    
                               user knowledge**                            

  H.P.1       Privacy          LLM [infers]{.underline}     High           Privacy and
                               correct or incorrect private                Confidentiality
                               or confidential data the                    
                               user never supplied                         

  H.P.2       Privacy          Plugin returns private or    High           Privacy and
                               confidential data to the LLM                Confidentiality
                               and LLM mishandles it                       

  H.T.1       Transparency     Lack of information on       High           User perspectives;
                               plugins exacerbates                         Security mgt
                               transparency and trust                      practices
                               issues                                      

  H.T.2       Transparency     Plugin competition risks     High           Multi-party
                               user confusion and unfair                   
                               decision-making                             

  H.A.1       Accountability   It is difficult to tell      High           Spec and testing;
                               whether a plugin, the                       User perspectives;
                               Copilot, or an LLM is at                    Adaptive automation
                               fault                                       

  H.A.2       Accountability   Do we have the capability to High           Security mgt
                               detect and respond to harm                  practices
                               by a plugin                                 
  --------------------------------------------------------------------------------------------


# Next Steps

Enhancing Copilots and LLMs with the ability to leverage arbitrary
software capabilities through the use of plugins will have lasting
impact across many diverse application scenarios. In this report we have
outlined responsible AI risks and harms that should be mitigated in
building a robust orchestrator/Copilot + plugin architecture that meets
the requirements for a responsible AI platform. There is an urgency to
addressing these issues. As an analogy, when the necessary technology
infrastructure was not in place for secure ecommerce, high profile scams
and hacks occurred that stalled ecommerce for a decade, eventually
requiring credit card guarantees, significant brand investment, etc.
before recovering. Similarly, LLMs with plugins require the definition
and implementation of key capabilities not currently present in existing
systems, and need it soon to avoid a similar stalling. Another analogy
is the Microsoft Trustworthy Computing (TwC) effort in the early 2000s,
which required years of security investments to implement. (Appendix A.3
defines requirements of non-AI software that help ensure privacy,
security, etc.)

Implementing these mitigations will require co-design of both the
orchestrator/Copilot framework and the LLM, including updates to the
interface between them. While LLM updates may help with mitigations,
improving the capabilities of the LLM alone is insufficient to mitigate
risks raised by LLMs calling plugins. It is a key business opportunity
for Microsoft to define an industry standard for building Copilots (and
other LLM orchestration frameworks) that support the key principles of
responsible AI.

Our recommendations fall into three categories: (1) specific
recommendations about how to organize existing responsible AI efforts
related to orchestrators/Copilots with plugins, (2) recommendations for
longer-term research to further enhance to RAI ecosystem with plugins,
and (3) recommendations for further study on topics deemed out of scope
for the current report.

**Short Term Recommendations**

We recommend Microsoft define workstreams around the following
capabilities that will address many of the high-risk RAI challenges
documented in this report:

[Technical mitigations in our platform:]{.underline}

-   **Recommendation #1: Define and implement platform capabilities
    focused on limiting the ability of external influences from
    commanding the LLM to take unintended actions.**

    -   An existing v-team focusing on XPIA is already actively working
        on this problem. We recommend that their efforts be integrated
        into the Azure OpenAI Platform so that all orchestrators (for
        Bing, M365, etc.) benefit from the controls defined and
        implemented.

    -   Assume that the attack landscape will change quickly so
        capabilities to rapidly detect new threats and respond with
        agility are needed.

-   **Recommendation #2: Define and implement Copilot platform and LLM
    application support for enabling explicit awareness of multiple data
    streams being processed. Given this capability, extend the
    infrastructure to enable mechanisms to audit and enforce information
    tracking into and out of the LLM.**

    -   Provide these capabilities in a way that is composable, so that
        different use cases in different vertical scenarios (healthcare,
        finance, etc.) have greater control and stronger guarantees over
        the flow of information.

-   **Recommendation #3: Initiate workstreams that define
    domain-specific properties and constraints for the purpose of
    enforcing security, privacy and fairness using the mechanisms
    defined in Recommendation #2.**

-   **Recommendation #4: Standardize monitoring, reporting, and response
    systems and workflows in the shared orchestrator when possible.**
    Extend existing Copilot / orchestrator and LLM telemetry to record
    and correlate activity across input streams (including 1^st^ party,
    3^rd^ party, and Copilot customer deployments). Telemetry and
    auditing tools across streams will help determine when LLM-induced
    mixing of stream data causes the most challenging problems in
    practice.

[Product specific investigations and coordination of
efforts:]{.underline}

-   **Recommendation #5: Robust investigations into each of the risks**
    above across our major Copilot products and underlying platforms.
    While the risks are numerous and there are analogies with known
    ecosystems such as app markets, as we highlight in this document,
    LLMs with plugins create new and less well-understood risks that
    require attention and technical investment to better understand. A
    starting point for such investments is to document the potential
    risks, create a taxonomy of potential behaviors, and place plugins
    into well-defined risk categories.

-   **Recommendation #6: To coordinate efforts, assign responsible DRI
    in major projects for cross-cutting high-risk scenarios.** Because
    Microsoft has and will have multiple 1^st^ party instances of
    Copilots with plugins, we recommend that a DRI for each of the areas
    of responsibility mentioned above be identified so that there is
    accountability in establishing cross-product consistency, oversight,
    and evaluation.

[Collaboration with LLM providers and the technical
community:]{.underline}

-   **Recommendation #7: Extend plugin descriptions beyond REST
    manifests.** Define and implement a shared taxonomy for categorizing
    plugins to create a common understanding of the risks involved with
    using them and the controls necessary to ensure that they are being
    used responsibly. One example of such a classification is provided
    in Appendix A.4. This recommendation will require finding a common
    taxonomy that spans 1^st^ party plugins (a.k.a. skills) and 3^rd^
    party plugins. In safety-critical systems, the [Safety Integrity
    Level](https://en.wikipedia.org/wiki/Safety_integrity_level) (SIL)
    is a mechanism to identify different levels of safety requirements
    that address associated potentials for harm.

-   **Recommendation #8: Collaborate with LLM providers to improve model
    quality and reliability around RAI issues.** We envision that the
    most effective mitigations will involve a richer interaction between
    the LLM and the copilot hosting it than current APIs provide.
    Actively collaborating with LLM vendors to improve LLM awareness of
    RAI issues with plugins and define and implement these enriched APIs
    will help reduce risks. Such methods might include, **f**or example,
    improving RLHF finetuning to better differentiate between user
    prompts and untrusted text from other sources or to better recognize
    likely private or confidential topics that should not be shared with
    plugins without explicit user permission.

[Workstreams for policy, process, and education-based
mitigations:]{.underline}

-   **Recommendation #9: Develop a process for validation and monitoring
    of plugin behavior.** This may encompass hosting a collection of
    plugins along with a protocol for how plugins can take actions on
    behalf of the users. Such a framework would exist for the purpose of
    ensuring RAI properties for the overall system and does not
    necessarily imply a particular business model or implementation such
    as an App store. The framework could include constraints such as
    specifying the types of allowed interactions between a plugin and a
    user, what permissions the user gives to plugins, descriptions of
    processes for auditing and validating plugins, etc.

-   **Recommendation #10: Provide informative guidance for responsible
    use of plugins to stakeholders** including plugin users, plugin
    developers, Copilot developers (individuals who create custom
    Copilots built on the shared Microsoft orchestration framework), and
    Copilot vertical specialists (individuals who set the policy
    controls for a given Copilot that satisfy the RAI requirements of
    their domain).

-   **Recommendation #11: For selected sensitive or critical verticals,
    develop specialized guidance on the development and usage of plugins
    and LLMs.** Infrastructure and processes should be configurable,
    customizable or otherwise adaptable to the needs of these vertical
    domains.

-   **Recommendation #12: Give users options to control the use of
    plugins.** To help users understand how plugins work and give them
    greater control in their use, provide options so that users can see
    what information is being passed to the plugin [before]{.underline}
    it is called. At the same time, it is important to keep in mind that
    users can quickly be overwhelmed with information and so providing
    user transparency and control to plugin interactions requires a
    thoughtful balanced approach.

**Longer Term Recommendations**

We understand that over time many aspects of existing Copilot with
plugin implementations will evolve based on the short-term activities
listed above as well as technology developments in the LLMs themselves.
We identify the following key areas for deeper research investment to
anticipate and prepare for these changes.

-   **Refining the orchestrator / LLM API to address the deep security
    and privacy issues** related to co-mingling input streams from
    different sources and streams the contain both data and commands.
    Recent work on [Guidance](https://github.com/microsoft/guidance)
    from MSR is a first step in this direction.

-   **When possible, have the LLM generate checkable code to perform an
    action.** For example, whenever it is necessary to communicate
    information through the LLM (such as passing information from
    sources the LLM can access to a plugin), have the LLM generate code
    that when executed bypasses the LLM when sending the information to
    the plugin. Such code can be evaluated independently of the LLM for
    important properties related to security and privacy.

-   **Define and implement mechanisms to allow stakeholders in
    orchestrator/Copilot plus plugin systems to flexibly delegate
    authority.** Being able to hand off responsibility for tasks from
    the user to the Copilot + plugin has enormous potential for enabling
    greater human productivity. At the same time, we have identified why
    failure to define and implement appropriate policies related to
    delegating authority can have serious consequences. New techniques
    for expressing and implementing such delegation are needed.

```{=html}
<!-- -->
```
-   **Determine how to use AI models in the orchestrator/Copilot** to
    enforce policies related to security, privacy, fairness, etc. Given
    how flexible the Copilot to plugin interaction can be (especially
    when the plugin itself is implemented with an LLM), it will be
    necessary to leverage AI models to help enforce policies that enable
    RAI principles across those interactions. Just as the software
    community has greatly increased the ability to specify complex
    properties of software and automatically verify them, new approaches
    to specifying and enforcing complex requirements on Copilot/plugin
    interaction are needed. Microsoft
    [TypeChat](https://github.com/microsoft/typechat) is an early
    example of approaches to leverage AI to constrain LLM interaction.

**\
Recommendations related to Additional Dynamics**\
\
For completeness, we include the recommendations raised in the Executive
Summary related to topics identified as beyond the scope of the current
study:

-   **We recommend that we shift our RAI mitigation strategies to
    methods with less in situ human involvement** to address anticipated
    user impatience with friction that will make human-in-the-loop
    mitigations less acceptable.

-   **We recommend a deeper analysis to inform business models and
    economic incentives for plugins** to anticipate that the business
    models around creating and deploying plugins will evolve rapidly.

-   **We recommend a separate LASER study be commissioned on LLMs and
    responsible AI concerns of dynamic, automated code generation** to
    address the likely evolution of AI code generation capabilities and
    the long-term impact that can have.




