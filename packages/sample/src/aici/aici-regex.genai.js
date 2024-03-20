script({
    model: "mixtral",
    aici: true,
})

$`Ultimate answer is to the life, universe and everything is ${AICI.gen({ regex: /\d\d/ })}`
