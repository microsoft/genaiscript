script({
    tests: {
        keywords: ["paris", "monday"],
        asserts: [
            {
                type: "not-icontains",
                value: "hello",
            },
        ],
    },
})
$`What is the capital of {{ country }}?`.jinja({ country: "France" })
$`Today is {{ day }}. What day of the week is it?`.mustache({ day: "Monday" })
$`This part of the prompt should not be inlined.
dsf
asdf
sadf
sadf
sdaf
sdf
sdaf
sdafd
sfsd
fsad
fsda
fds
fsdf
sdf
asdf
asdf
sadf
sdaf
sda
fsd
fsd
fsd
f
df
 SaY HELLO.`.maxTokens(1)
