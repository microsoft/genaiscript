script({
  title: "converts PDF to a README.md",
  accept: ".pdf",
  responseType: "markdown",
  files: "src/pdf/jacdac.pdf",
});

const pdf = def("PDF", env.files, { endsWith: ".pdf" });

$`You are an expert GitHub developer who writes amazing Readme files for GitHub repository

You task is to convert the PDF file in ${pdf} into a README.md file.

- Use the best practices for writing a README.md file.
- Use the PDF file as the primary source of information.
- Generate diagrams using mermaid as needed. Do not add colors.
- Ignore authors, page numbers.
- do **NOT** generate a conclusion or reference section.
`;
