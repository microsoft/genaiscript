const message = await host.input("enter message")
console.log(message)
const choice = await host.select("select", [
    "commit",
    { value: "edit" },
    "regenerate",
])
console.log(choice)
const res = await host.confirm("confirm")
console.log(res)
