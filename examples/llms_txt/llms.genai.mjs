import { fileTree } from "@genaiscript/runtime"

script({
    description: "Generate a llms.txt file for a project",
    model: "long",
    responseType: "markdown",
    tools: "fs_read_file",
})

def("FILES", await fileTree("genaisrc/**"))

$`# **Prompt**  

**Task:**  
Generate an llms.txt file in Markdown format that provides a structured and well-organized overview of all files within a given directory. The document should enhance readability and maintainability while offering a clear understanding of the project's structure and purpose.  

---

### **Requirements:**  

1. **Project Overview:**  
   - Use the directory name as the title (# ProjectName).  
   - Include a blockquote (>) summarizing the project’s purpose and functionality concisely.  

2. **File Structure Representation:**  
   - Provide a **hierarchical file map** using bullet points (- for files and subdirectories).  
   - Properly indent nested files to reflect the actual directory structure.  

3. **File Descriptions:**  
   - Each key file should have a **brief yet informative description**, explaining its role in the project.  
   - Use bold formatting (**FileName**) for file names in this section.  

4. **Formatting Guidelines:**  
   - Use Markdown syntax correctly for headings, blockquotes, and lists.  
   - Ensure clarity and consistency in descriptions.  
   - Focus on **concise, high-level** descriptions while avoiding redundancy.  

---

### **Example Output (llms.txt):**  

markdown
# ProjectName  

> ProjectName is a lightweight framework for building scalable web applications, integrating modern libraries with minimal configuration.  

## File Map  
- /  
  - README.md  
  - package.json  
  - /src  
    - index.js  
    - app.js  
  - /config  
    - default.json  

## File Summaries  
- **README.md**: Contains project documentation, including setup instructions and usage guidelines.  
- **package.json**: Defines project metadata, dependencies, and available scripts.  
- **src/index.js**: Entry point of the application, responsible for initializing the core logic.  
- **src/app.js**: Contains the main business logic and routing configuration.  
- **config/default.json**: Stores default configuration settings for the application.  
  

---

### **Additional Notes:**  
- Use **descriptive yet succinct** wording to ensure clarity without excessive detail.  

`
