script({
    tests: "src/xpai/jailbreaks-keyword-payload-lite.json",
    group: "xpai",
})

def("FILES", env.files)
$`Summarize files.`
