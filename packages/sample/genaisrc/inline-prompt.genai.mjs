script({ model: "small", system: ["system"], systemSafety: false });
await prompt`write a poem`;
await prompt`write another poem`.options({ model: "small" });
$`write another poem`;
