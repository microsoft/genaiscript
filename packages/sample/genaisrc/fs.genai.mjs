script({
    model: "small",
    tools: ["fs_find_files", "fs_read_file", "fs_ask_file"],
    tests: {},
})

$`List the cities in the src folder markdown files as a CSV table. The file should contain the word "city".`
