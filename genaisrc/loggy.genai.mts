const sg = await host.astGrep()
const { matches } = await sg.search("ts", "packages/core/src/*.ts", YAML`
rule:
  kind: if_statement
  has:
    kind: expression_statement
    not:
        has:
            kind: "call_expression"
            regex: ^dbg\\(  
`)

console.log(matches.length)
