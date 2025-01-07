system({
    title: "SynthLang - Blog post generation with SEO optimization",
    system: ["system.synthlang"],
})
$`
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
`
