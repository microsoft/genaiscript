// ES2024 Features Demo
script({ model: "echo",  group: "commit", tests: {} })

// 1. Array.prototype.toSorted() - Returns a new sorted array without modifying the original
const numbers = [3, 1, 4, 1, 5, 9]
const sortedNumbers = numbers.toSorted()
console.log("Original:", numbers) // [3, 1, 4, 1, 5, 9]
console.log("Sorted:", sortedNumbers) // [1, 1, 3, 4, 5, 9]

// 2. Array.prototype.toReversed() - Returns a new reversed array
const fruits = ["apple", "banana", "cherry"]
const reversedFruits = fruits.toReversed()
console.log("Original:", fruits) // ['apple', 'banana', 'cherry']
console.log("Reversed:", reversedFruits) // ['cherry', 'banana', 'apple']

// 3. Array.prototype.with() - Returns a new array with one element replaced
const colors = ["red", "green", "blue"]
const newColors = colors.with(1, "yellow")
console.log("Original:", colors) // ['red', 'green', 'blue']
console.log("Modified:", newColors) // ['red', 'yellow', 'blue']

// 4. Array.prototype.findLast() - Finds the last element that satisfies the condition
const numbers2 = [1, 2, 3, 4, 5, 4, 3, 2, 1]
const lastEven = numbers2.findLast((num) => num % 2 === 0)
console.log("Last even number:", lastEven) // 2

// 5. Array.prototype.toSpliced() - Returns a new array with spliced elements
const letters = ["a", "b", "c", "d"]
const splicedLetters = letters.toSpliced(1, 2, "x", "y")
console.log("Original:", letters) // ['a', 'b', 'c', 'd']
console.log("Spliced:", splicedLetters) // ['a', 'x', 'y', 'd']

// 6. Promise.withResolvers() - Exposes promise resolver functions
async function promiseExample() {
    const { promise, resolve, reject } = Promise.withResolvers()

    // Simulate async operation
    setTimeout(() => resolve("Success!"), 1000)

    const result = await promise
    console.log(result) // 'Success!'
}

// Run the example
await promiseExample().catch(console.error)
