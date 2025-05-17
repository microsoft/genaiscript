script({ model: "echo", tests: {} })
const hugeString = "x".repeat(2 * 1024 * 1024)
console.log(hugeString)
