script({
    title: "readxl10",
    model: "openai:gpt-4-32k",
    group: "spreadsheets",
    system: ["system"],
})

const sheets = await parsers.XLSX(env.files[0])
const { rows } = sheets[0]
const rows10 = rows.slice(0, 10)
console.log("rows10", rows10)

const summary = defData("SUMMARY", rows10)

// use $ to output formatted text to the prompt
$`Your task is to create the file summary.csv which summarizes 
that content of a number of spreadsheet files.  ${summary} describes the contents of each file.
Your summary should contain the following columns:
- filename
- sheetname
- category of spreadsheet based on the data in the first 10 rows
- natural language used in the sheet
- a boolean indicating whether the sheet is a template without data or a sheet with data
`
