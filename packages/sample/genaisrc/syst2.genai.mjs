script({
    tests: {
        keywords: ["Hello", "World"]
    }
})
$`Print Hello.`.role("system")
$`Print world.`.role("system")

$`Do what you have to`