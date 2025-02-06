system({
    title: "SynthLang - Blog post generation with SEO optimization",
    system: [],
})

//
// SynthLang is a hyper-efficient prompt language for LLMs,
// using compact glyphs and logographic scripts to reduce token usage and mitigate bias.
// You will interpret and respond to SynthLang instructions according to these rules.
// https://synthlang.fly.dev/documentation"
//

$`## SynthLang
[Overview]
SynthLang is a hyper-efficient prompt language for LLMs, using compact glyphs and logographic scripts to reduce token usage and mitigate bias. You will interpret and respond to SynthLang instructions according to these rules.

[Grammar and Syntax]
1. Task Glyphs (T)
 - Σ (Summarize)
 - ↹ (Focus/Filter)
 - ⊕ (Combine/Merge)
 - ? (Query/Clarify)
 - IF (Conditional)
 (Each glyph must be preserved as a single token.)

2. Subject Glyphs (S)
 Examples: •dataset, •salesData, 花 (flower), 山 (mountain)
 (Represent tasks or data objects to be processed.)

3. Modifiers (M)
 Examples: ^4, ^eng, ^urgent, ^7d, ^brief, etc.
 (Add nuance or scope to tasks, e.g., emphasis level, output language, or time range.)

4. Flow Glyphs (F)
 Examples: [p=5], ⊕
 (Set priority or combine tasks.)

5. Microparticles
 - : (Link labels to objects)
 - => (Implication/Result)
 - | (Logical OR)
 - + (Concatenate outputs)
 - -> (Action direction)

[Usage Rules]
A. Keep the glyphs intact.
B. If a prompt is unclear, ask for clarification.
C. Follow modifiers strictly (e.g., if ^10w is specified, limit summaries to ~10 words).

[Examples]
USER: ↹ [p=5] 法:"montagne" ⊕ Σ "意味" ^eng
MODEL: "Chinese: '山'. English summary: 'The mountain is beautiful in spring.'"

[Output Formatting]
- Minimal text or bullet points if needed.
- Provide rationale only if ^rationale is included.
- Use English only if ^eng is explicitly requested, otherwise honor the language context.

[Error Handling / Clarifications]
- If conflicting modifiers appear, address whichever has higher priority (p=5 > p=2).
- If no clear resolution, ask the user for clarification.`.role("system")

$`
# Blog post generation with SEO optimization
↹ topic"AI in Healthcare" @industry_context
⊕ research → outline
⊕ generate_draft ^creative
↺ {
  ⊕ improve_content @seo_guidelines
  ⊕ check_metrics {
    readability: true,
    seo_score: true,
    engagement: true
  }
  ⊥ when all_metrics > 0.8
}
Σ  {
content: markdown ^professional,
meta: json ^seo,
stats: formatted ^metrics
}

# Technical documentation generator
↹ code_files @project_context
∀ file → {
  ⊕ analyze_structure
  ⊕ extract_api_specs
  ⊕ generate_docs ⊗ format
}
⊕ aggregate_docs
⊕ validate_completeness
Σ documentation ^comprehensive
`
