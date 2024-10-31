
const res = await prompt`write a poem`.options({ model: "azure_serverless:gpt-4o"})
if (res.error) throw res.error

const res2 = await prompt`write a poem`.options({ model: "azure_serverless_models:Mistral-small-lxmkq"})
if (res2.error) throw res.error
