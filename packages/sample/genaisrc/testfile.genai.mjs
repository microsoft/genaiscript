script({
    tests: ["src/testfile.json", "src/testfile.csv"],
    model: "small",
    redteam: {
        plugins: "hallucination",
        strategies: "jailbreak"
    }
})
def("FILE", env.files)
$`Summarize <FILE>.`