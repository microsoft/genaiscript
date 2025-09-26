script({
    systemSafety: false,
    model:"none"
})

const write = await runPrompt(
    (ctx) => {
        ctx.$`Use GenAIScript's system.fs_write_file to write the string "foobar" to a file named "output.txt" in the current directory. Return an object with a single property "success" set to true if the operation was successful. If there was an error, return an object with a single property "error" containing the error message.`;
    },
    { model: "large", system: ["system.fs_write_file"] });
if (write.error) {
    cancel(`Failed to write file: ${write.error?.message ?? "No error message"} (finishReason: ${write.finishReason ?? "unknown"})`);
}