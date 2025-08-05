script({
    title: "Test fs_write_file tool",
    description: "Test the fs_write_file system tool with workspace validation",
    system: ["fs_write_file"],
})

$`Test the fs_write_file tool by writing a simple file to the workspace.`

// First, try writing a simple file in the workspace
$`Write "Hello World!" to a file called "test.txt" using the fs_write_file tool.`

// Try writing outside workspace - this should fail
$`Try to write to "/etc/passwd" - this should fail with a workspace validation error.`

// Try appending to a file
$`Create a file "log.txt" with content "Log entry 1\n", then append "Log entry 2\n" to it.`