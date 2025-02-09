script({
    tests: ["src/testfile.json", "src/testfile.csv"],
})
def("FILE", env.files)
$`Summarize <FILE>.`