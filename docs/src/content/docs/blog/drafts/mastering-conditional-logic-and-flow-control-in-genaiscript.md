---
title: Mastering Conditional Logic and Flow Control in GenAIScript
date: 2025-05-19
authors: genaiscript
draft: true
tags:
  - GenAIScript
  - scripting
  - conditional logic
  - flow control
  - prompt engineering

---

# Mastering Conditional Logic and Flow Control in GenAIScript 🎛️

GenAIScript isn’t just about crafting simple prompts and responses—it’s a versatile scripting language that empowers you to create dynamic, interactive workflows. If you want to build scripts that adapt to user input, make decisions, and branch logic, you need to master _conditional logic_ and _flow control_. In this post, we’ll walk through a practical example, explaining each line of code as we construct a prompt-driven script that responds intelligently to the user.

## Script Walkthrough: Smart Number Evaluator 🎲

Below is a GenAIScript sample that interacts with users, evaluates their input, and demonstrates how to nest and chain conditional statements for complex behaviors.

```js
let userInput = prompt("Enter a number between 1 and 100:")
let number = parseInt(userInput)

if (isNaN(number)) {
  print("That's not a valid number.")
} else if (number < 1 || number > 100) {
  print("Number is out of range. Please enter a number between 1 and 100.")
} else if (number % 2 === 0) {
  print(`You entered an even number: ${number}`)
  let half = number / 2
  if (half > 10) {
    print(`Half of your number is ${half}, which is greater than 10.`)
  } else {
    print(`Half of your number is ${half}, which is 10 or less.`)
  }
} else {
  print(`You entered an odd number: ${number}`)
  if (number > 50) {
    print("That's a big odd number!")
  } else if (number === 13) {
    print("Unlucky 13!")
  } else {
    print("That's a small odd number.")
  }
}
```

Let’s break down what’s happening, step by step.

---

## 1️⃣ Prompting the User

```js
let userInput = prompt("Enter a number between 1 and 100:")
```

- `prompt()` is a GenAIScript global that shows a message and waits for user input.
- The value entered is stored in `userInput` as a string.
- Learn about `prompt` in the [official documentation](https://microsoft.github.io/genaiscript/reference/globals/#prompt).

---

## 2️⃣ Converting Input to a Number

```js
let number = parseInt(userInput)
```

- `parseInt()` tries to convert the user’s input to an integer.
- If the input isn't a valid number (e.g., “hello”), this will result in `NaN`.
- This step is crucial for ensuring later math and logic will work as expected.

---

## 3️⃣ Checking for Valid Number Input

```js
if (isNaN(number)) {
  print("That's not a valid number.")
}
```

- `isNaN(number)` checks if the parsed value is _not_ a number.
- If true, we use `print()` to inform the user of an invalid entry.
- The script stops evaluating later branches of the logic after this message.

---

## 4️⃣ Handling Out-of-Range Numbers

```js
else if (number < 1 || number > 100) {
  print("Number is out of range. Please enter a number between 1 and 100.")
}
```

- The script uses `else if` for more checks.
- It verifies if `number` is outside the allowed 1–100 range.
- Users are promptly notified to stay within range.
- `||` means “or”—this condition triggers if _either_ side is true.

---

## 5️⃣ Even Number Logic

```js
else if (number % 2 === 0) {
  print(`You entered an even number: ${number}`)
  let half = number / 2
  if (half > 10) {
    print(`Half of your number is ${half}, which is greater than 10.`)
  } else {
    print(`Half of your number is ${half}, which is 10 or less.`)
  }
}
```

- If the number is even (`% 2 === 0`), the script responds accordingly.
- It then calculates half the value, storing it in `half`.
- A nested `if...else` checks if this half-value is greater than 10.
- Tailored messages are printed based on the outcome.
- Nested logic like this is powerful for rich, context-sensitive responses.

---

## 6️⃣ Odd Number Handling

```js
else {
  print(`You entered an odd number: ${number}`)
  if (number > 50) {
    print("That's a big odd number!")
  } else if (number === 13) {
    print("Unlucky 13!")
  } else {
    print("That's a small odd number.")
  }
}
```

- For all other (odd) numbers, another set of checks is applied.
  - If the number is greater than 50, the script acknowledges the “big” odd number.
  - Special handling for the famous “unlucky 13”.
  - Otherwise, a general message for small odd numbers.
- Notice how multiple `else if` statements build richer flows.

---

## Why Master Conditional Logic?

Being comfortable with `if`, `else if`, and `else` in GenAIScript unlocks a world of scripting creativity:

- **Create interactive agents that react contextually to inputs.**
- **Validate and sanitize user data before making AI calls.**
- **Develop intelligent branching flows for complex prompt chains.**

For more advanced techniques and reference, check out the [GenAIScript documentation](https://microsoft.github.io/genaiscript/). To see more scripts like this one, browse examples in `packages/sample/src/*.genai.*js` in your project.

---

## Recap 🚦

- Use `prompt()` and `print()` for interactive scripts.
- Parse and validate user input before making decisions.
- Chain and nest `if...else` statements for dynamic workflows.

Happy scripting—and go *beyond* the basics with GenAIScript’s full flow-control capabilities! 💡