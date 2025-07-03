script({
  title: "Sanitize",
});

// Main sanitize function that injects comments into the target file
export const sanitize = async () => {
  const { dbg } = env;
  // Path to the file to be sanitized
  const filePath = "genaisrc/sanitize-copy.genai.mts";

  // Read the file contents from the workspace
  const fileObj = await workspace.readText(filePath);

  console.log(fileObj);

  // Generate a commented version of the file
  const result = await addCommentsToFile(filePath, fileObj.content);

  // Overwrite the original file with the commented content
  await workspace.writeText(filePath, result.content);
};

// Given a file and its contents, generate a version with helpful comments inserted
async function addCommentsToFile(
  file: string,
  fileContent: string,
): Promise<{ content: string; error?: string }> {
  console.log(`Generating comments for ${file}`);

  // Infer file extension to determine appropriate comment style/language
  const fileExt = file.split(".").pop()?.toLowerCase();
  console.log(`File extension: ${fileExt}`);
  try {
    // Leverage the prompt runner to use an LLM for comment generation
    const result = await runPrompt(
      (_) => {
        // Supply file content and language to prompt context
        _.def("FILE_CONTENT", fileContent, {
          maxTokens: 10000,
          language: fileExt,
        });

        // Instruct the LLM to add comments in a conservative way
        _.$`Add helpful and descriptive comments to the FILE_CONTENT. 
          Focus on complex logic, non-obvious functionality, and important sections.
          Use the appropriate comment syntax for the file type.
          Return the entire file with comments added.
          Preserve all existing code and comments.
          Don't change any functionality. Do not strip, escape, santize, or modify the code in any way.`;
      },
      {
        model: "large",
        label: "generate code comments",
        system: ["system.assistant"],
        systemSafety: true,
        responseType: "text",
      },
    );

    console.log("Result", result);

    // Return the generated, commented file content
    return { content: result.text };
  } catch (error) {
    // On failure, pass the original contents and the encountered error
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { content: fileContent, error: errorMessage };
  }
}

export default sanitize;
