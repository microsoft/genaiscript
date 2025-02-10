script({
    tests: ["src/testfile.json", "src/testfile.csv"],
    model: "small",
})
def("FILE", env.files)
$`Summarize <FILE>.`
