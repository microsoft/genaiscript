# Area of Investigation: Adversarial actors

  -----------------------------------------------------------------------------------------------
              RAI Area         Issue                                               Priority
  ----------- ---------------- -------------- ------------------------------------ --------------
  **C.S.1**   **Security**                    **Unauthorized command execution     **Critical**
                                              through cross user prompt injection  
                                              attacks (XPIA)**                     

  H.S.1       Security         LLM may choose                                      High
                               to trust an                                         
                               adversarial                                         
                               plugin                                              

  H.S.2       Security         Request                                             High
                               forgery when                                        
                               multiple                                            
                               plugins are                                         
                               activated in                                        
                               one chat                                            

  H.S.3       Security         LLMs with                                           High
                               plugins can                                         
                               automate and                                        
                               scale                                               
                               malicious                                           
                               attacks                                             


  -----------------------------------------------------------------------------------------------

Summary of findings

When thinking about adversarial actors of LLM plugins, we realize that
the problem has similarity to that of cloud-service orchestration
frameworks, e.g., IFTTT (If This Than That) and Azure Logic Apps.
Security challenges like cross-site scripting, cross-site request
forgery, over-privilege, authorization, and validation are also
meaningful in the new context of LLM plugin security. However, unlike
the old problem, we no longer have the distinction between "code" and
"data", because all the interactions between the LLM orchestrator and
plugins are in a natural language. It is easy for a plugin to strongly
influence LLM's basic thinking process, thus causing an effect similar
to the traditional code-injection attack. Moreover, the invocation
criteria are unclear. They appear to be strongly influenced by what
plugins claim by themselves, thus enabling an effect similar to the
phishing attack. The table below gives a rough mapping between the
concepts in the context of web/cloud security and that of LLM security.

  -----------------------------------------------------------------------
  *In the context of web/cloud        *In the context of LLM security*
  security*                           
  ----------------------------------- -----------------------------------
  *IFTTT and Azure Logic Apps*        *LLM orchestrator*

  *Code vs. data*                     *Orchestrator's own prompts vs.
                                      external prompts/messages*

  *Cross-site scripting*              *Prompt injection (XPIA)*

  *Cross-site request forgery*        *Plugin-A induces Plugin-B to take
                                      an action specified by Plugin-A
                                      (a.k.a. cross-plugin request
                                      forgery)*

  *Phishing*                          *A plugin falsely advertises itself
                                      to gain traffic*

  *Sandbox/security-context*          *No corresponding notions*
  -----------------------------------------------------------------------

Method(s) of investigation

We used the existing ChatGPT plugins to conduct the study, but did not
implement our own malicious plugins. Despite this limitation, our
observations still reveal the interactions and influences between
plugins, and between a plugin and ChatGPT. It is easily conceivable that
if a plugin was malicious, it would become an adversarial actor.
Regarding attack scenarios, we consider both the one-plugin scenario and
the multiple-plugin scenario. In the former, the plugin can be malicious
(i.e., acting as the attacker) or vulnerable (acting as the victim,
being attacked by its information source). In the latter, one plugin is
malicious, which tries to cause other honest plugins to perform
arbitrary actions controllable by the malicious plugin.

When discussing potential mitigations, we focus on how LLM orchestrators
should confine privileges and validate responses of plugins, rather than
on the secure programming practice of plugins.

Detailed findings

High risk (with illustrative examples)

**C.S.1. Critical risk issue**: **Unauthorized command execution through
cross user prompt injection attacks (XPIA)\
**The XPIA attack is similar to the cross-site scripting attack in web
security. In both cases, information intended to be consumed as "data"
is taken as "code" to be executed. As a result, the current session
(whether it is a web session or a chat session) is taken over by the
owner of the malicious contents. The new challenge surrounding XPIA in
LLM systems is that the boundary between "data" and "code" is extremely
fuzzy in LLM systems.

Figure 2 shows an example XPIA attack in BizChat (Microsoft
confidential). First, an attacker prepares a malicious attack and places
it in a file (kcc16.txt, in this case). This malicious file contains
instructions to retrieve the victim's most recent email from "Josh", and
then exfiltrates this stolen data via a markdown attack. If BizChat
summarizes this untrusted file, BizChat follows the attacker's
instructions embedded in the file and, as shown below, the attack
succeeds.

XPIA attacks have been introduced into Copilots by embedding
instructions into public web pages, inside emails, inside doc files, and
in the return values from plugins. We expect that this specific attack
in BizChat will also succeed in such scenarios. While this attack relies
on exfiltration through a markdown-based image request, alternative
exfiltration methods using plugins to send emails or upload files are
also likely to succeed.

![Image preview](media/image2.png){width="6.5in" height="5.7375in"}

Figure - Screenshot of an XPIA attack in BizChat (Microsoft
Confidential) - an untrusted file kcc16.txt instructs the LLM to
retrieve recent (private) emails and exfiltrates this information by
embedding it in a GET request for the shown image of a kitten.

The scope of the security damage due to an attack such as this can have
arbitrarily big impacts, depending on the privileges of the victim
plugins, as described below*.*

We've spent years securing data and exposing it through well-defined
APIs with strong RBAC (Role-Based Access Control) policies. Plugins make
that data available through a natural language interface and make no
distinction between control instructions (the metaprompt) and user data
(the user's prompt).  

Natural language is highly ambiguous and has been shown through multiple
red team operations it is an effective attack vector against LLMs (e.g.
via prompt injection). We should expect that adversaries will quickly
learn to exploit this interface for data exfiltration and tampering. For
example, Azure AI Red team was able to perform SQL Injection to delete
tables from a database (see the [[AOAI Plugins
Report]{.underline}](https://microsoft.sharepoint.com/teams/AIRT/Shared%20Documents/Engagements/internal/2023/Azure%20OpenAI/AIRT%20-%20AOAI%20Plugins%20Report.docx?web=1)
for full details).

The intermingling of control and data also increases the attack surface
for the Copilot orchestrator -- since the metadata provided by plugins
is consumed by an LLM, that metadata itself *including* all the natural
language descriptions are now a plausible attack vector for an adversary
to use.   

Another complication with such XPIA attacks is that the plugin that
causes them may not be malicious itself but instead might serve as a
conduit that retrieves malicious content from another source and returns
it to the LLM. Thus, vetting and removing adversarial plugins is an
insufficient remedy for these attacks.

**H.S.1. High risk issue: LLM may inadvertently trust malicious
plugins**

When an LLM is tasked with selecting and trusting a plugin requiring
credentials, it may be deceived by a malicious plugin. If the LLM
automatically shares credentials with the plugin, or if the user
provides their credentials indiscriminately, then this plugin could
abuse the credentials without providing any further opportunity for user
confirmation.

REST based plugin platforms lack mechanisms to restrict such malicious
plugins. For example, a travel booking plugin might acquire the user\'s
payment and Expedia login information and perform harmful actions beyond
its stated purpose, all due to the LLM\'s misplaced trust.

While Copilots currently require users to explicitly enable plugins, two
key factors will lead to reduced human oversight: (1) the user may not
have the necessary information to determine whether to trust a plugin
(see AOI: User Perspectives section); and (2) as the number of available
plugins increases over time, there will be pressure to automate or
semi-automate plugin selection with LLMs.

![A screenshot of a email Description automatically generated with
medium confidence](media/image3.png){width="3.2449551618547683in"
height="3.2848239282589677in"}

Zapier.com page for the user to confirm a ChatGPT-generated Gmail
action.

**H.S.2. Business logic attack when multiple plugins are activated in
one chat**\
While C.S.1 demonstrates a security risk that the LLM may execute
instructions contained in untrusted data (similar to a remote code
exploit); and H.S.1. demonstrates the risk of giving user credentials to
a malicious plugin that should not have been trusted; this threat,
H.S.2., focuses on business logic attacks, where untrusted content is
able to manipulate the "business logic" embedded in the Copilot and/or
other plugins to achieve a specific, malicious outcome.

Suppose a Copilot is running with multiple plugins installed, and the
user only provides their login credential to one of the plugins.
However, another plugin can return a response that -- even without being
interpreted as a command instruction to the LLM \-- can influence the
Copilot to issue problematic requests to the sensitive plugin, e.g., to
send an email or to issue a money transfer. This is similar to "Cross
Site Request Forgery (CSRF)" in the web security space.[^4]

The following example shows one plugin's returned content can decide
whether a request to another plugin should be issued. Specifically, the
user asks ChatGPT to send an email if Microsoft does (or doesn't)
violate the COPPA Act. Of course, there is no malicious plugin in this
example. However, it shows that the content from one plugin can easily
affect the behaviors of ChatGPT and other plugins.

![A screenshot of a computer screen Description automatically generated
with low confidence](media/image4.png){width="3.117538276465442in"
height="2.743834208223972in"} ![A screenshot of a computer Description
automatically generated with low
confidence](media/image5.png){width="3.0452121609798777in"
height="2.8015310586176727in"}

The content returned by the first plugin (WebPilot) can determine
whether the second plugin (Zapier) is invoked

**H.S.3. LLMs with plugins can automate and scale malicious attacks**

The integration of LLMs with software extensions and plugins provides
malicious actors with an ability to automate tasks that previously
required human effort. As a result, malicious actors can automate and
scale up attacks that would previously have been too expensive or too
labor intensive. Examples of such scenarios include:

1)  Personalized social engineering attack and scamming: LLMs with
    software extensions and plugins can provide malicious actors with
    the ability to automatically research and identify likely targets,
    and identify their interests and weaknesses. Whereas before, a
    sophisticated attack would require significant human effort per
    victim, now the end-to-end attack can be automated and scaled out.

2)  Impersonation: deepfake video and audio can impersonate a targeted
    individual. An LLM can enable an interactive simulacrum, made more
    convincing through plugins that aid automated research on the
    targeted individual, their biographical information, speech style,
    etc.

3)  Stalking via street cams: multimodal models with web browsing
    plugins may monitor and analyze video streams at a scale and
    continuity that was not accessible to most people. Now, with
    Copilots that can follow natural language commands, we expect such
    functionality to be easy for amateurs to implement. As a result, we
    expect a rise in Copilots abusing publicly accessible information,
    such as street and traffic cams that stream online, to stalk
    individuals or perform other malicious monitoring.

Unlike other identified security risks in this report that focus on
security vulnerabilities in LLM+plugin systems, H.S.3 is an example of
an adversary abusing LLM+plugins for malicious purposes. This scenario
presents special challenges as the LLM+plugins systems used by
adversaries need not be implemented on Microsoft's platforms or
infrastructure. To prevent or protect against these attacks, we
recommend (1) hardening our software infrastructure to protect potential
victims/targets \-\-- for example, by improving our monitoring and
warning of suspicious communications; and (2) ensuring our platforms are
safe deployments that monitor for and disallow such malicious uses, and
are an example to guide regulation and policy.

Mitigations to explore

**Potential mitigation against prompt injection**. The common root cause
of injection attacks (including cross-site scripting and SQL injection)
is a piece of data from the attacker manages to escape from the context
that the system sets for it. A direction to explore is how to impose
"contexts" for data from different sources and train the LLM
orchestrator not to mix the contexts. Our preliminary test shows that
ChatGPT 4.0 is unable to separate different contexts. Our prompt is
designed to put the dangerous sentence "from now on ...." into the
context of a movie and emphasize that a movie is not the real life. This
attempt is partially successful, as ChatGPT says that "it's important"
to understand the difference between a film and the real life. However,
when we explicitly ask a real-life question, ChatGPT is still affected
by the movie context. We consider this partial success to be an
interesting potential for further research.

![A screenshot of a movie Description automatically generated with low
confidence](media/image11.png){width="4.206802274715661in"
height="1.5087860892388452in"}

![A screenshot of a computer Description automatically generated with
low confidence](media/image12.png){width="4.209362423447069in"
height="0.9300174978127734in"}

**"Topical permissions" for plugins**. Currently, a plugin can generate
responses about any topic. In traditional software, a module can only
perform tasks within its permission boundary. It may be worth exploring
how to define "topical permissions" for plugins, and who is responsible
for declaring and enforcing them. For example, if a Redfin plugin tries
to influence an LLM about math inference rules, the content should be
considered a "permission violation" and thus ignored.

**Cross-examination with other plugins or knowledge sources**. To guard
against an incorrect answer from a plugin, the LLM orchestrator can
utilize other plugins or knowledge sources for validation. In the
earlier example, Got2Go returns two hotels, which are in fact in the
city of "Washington, Utah", when the LLM's query is "Washington State".
The LLM can send a validation query to the Expedia plugin, asking "Is
the hotel in the first link located in the previous message in
Washington State?"

Further investigation

1.  In traditional security problems, the notions of "permission" and
    "security context" are very important. Deeper research needs to be
    conducted with product teams to obtain concrete understanding about
    these notions in LLM security problems. Traditionally, "permissions"
    and "security contexts" are of a discrete and enumerable nature, the
    LLM "permissions" and "security contexts" are likely unenumerable,
    which imposes a challenge.

2.  Once "permission" and "security context" are understood, research is
    needed to design a sandboxing mechanism. Because of LLM's
    statistical nature, the sandboxing effectiveness will also be
    probabilistic. How to accurately measure the effectiveness is a new
    research topic.

3.  On the other side, researchers should work with red-team engineers
    to build proof-of-concept malicious plugins to demonstrate possible
    threats, so that the discussions about defense technologies can be
    concrete.