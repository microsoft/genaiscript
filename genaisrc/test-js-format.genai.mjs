script({
  parameters: {
    target: {
      type: 'string',
      default: 'CLI integration',
    },
  },
})

$`Testing frontmatter parameters: ${env.vars.target}`