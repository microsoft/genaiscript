script({
    model: "aici:mixtral",
    title: "AICI character generation",
    system: [],
})

$`Here's info of a game character:\n`
$`Name: ${AICI.gen({ regex: /[A-Z][A-Za-z \n]*/, stopAt: "\n", storeVar: "name" })}\n`
$`Age: ${AICI.gen({ regex: /\d{2}/, storeVar: "age" })}\n`
$`Strength: ${AICI.gen({ regex: /\d{3}/, storeVar: "strength" })}\n`

defOutput(out => {
    const vars = {}
    for (const f of out.fences) {
        vars[f.label] = f.content
    }
    console.log("vars:" + JSON.stringify(vars))
    return {
        text: JSON.stringify(vars, null, 2)
    }
})