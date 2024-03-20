script({
    model: "mixtral",
    aici: true,
    system: [],
})

$`Ultimate answer is to the life, universe and everything is ${AICI.gen({ regex: /\d\d/ })}`
