script({
  system: [
    "system.agent_git",
    {
      id: "system.agent_git",
      parameters: { repo: "microsoft/jacdac", variant: "jacdac" },
    },
  ],
});

$`Generate a table with the last commits of the jacdac and current git repository?`;
