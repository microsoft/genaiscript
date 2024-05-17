script({ title: "readxl10", 
         model: "gpt-4-32k", 
         group: "spreadsheets", 
         system: ["system"]})

const rows = await parsers.XSLX(env.files[0]);
const rows10 = rows.slice(0, 10)
console.log("rows10", rows10)   

def("SSSUMMARY", rows10)

// use $ to output formatted text to the prompt
$`Your task is to create the file summary.csv which summarizes 
that content of a number of spreadsheet files.  SSSUMMARY describes the contents of each file.
Your summary should contain the following columns:
- filename
- sheetname
- category of spreadsheet based on the data in the first 10 rows
- natural language used in the sheet
- a boolean indicating whether the sheet is a template without data or a sheet with data
`        
