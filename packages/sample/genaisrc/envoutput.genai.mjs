const { output } = env

output.heading(3, "hello world")

$`Write a poem`

output.itemValue("item", "value")
output.fence("This is a fence")
output.fence([{a: 1, b: 2}, {a: 3, b: 4}], "md")
output.fence([{a: 1, b: 2}, {a: 3, b: 4}], "csv")
