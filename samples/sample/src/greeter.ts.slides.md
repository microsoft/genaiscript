### Introduction

- TypeScript class example
- Demonstrates basic class structure
- Shows instantiation and method usage

---

### Class Definition

- `Greeter` class with a single property
- Constructor to initialize the property
- Method to return a greeting message

```ts
class Greeter {
    greeting: string;
    ...
}
```

---

### Constructor

- Initializes the `greeting` property
- Takes a `message` parameter

```ts
constructor(message: string) {
  this.greeting = message;
}
```

---

### Greet Method

- Constructs a greeting string
- Returns the greeting with "Hello, "

```ts
greet() {
  return "Hello, " + this.greeting;
}
```

---

### Instantiation

- Creating an instance of `Greeter`
- Passing "world" as the greeting message

```ts
let greeter = new Greeter("world");
```

---

### Summary

- Explored a TypeScript `Greeter` class
- Covered class structure and methods
- Demonstrated object creation and interaction
