GenAIScript includes expert programming language personas that provide specialized knowledge and best practices for different programming languages. These personas are automatically activated when your scripts reference specific language keywords or file extensions.

## Available Language Personas

### Go (Golang) - `system.go`

The Go persona provides expertise in:
- Proper error handling with explicit error checking
- Clear and concise variable and function naming following Go conventions  
- Appropriate use of goroutines and channels for concurrency
- Proper package organization and imports
- Following the Go standard library patterns and conventions
- Writing idiomatic Go code that is simple, readable, and efficient

**Auto-activation triggers:**
- File extensions: `*.go`
- Keywords: `golang`, `go ` (with space)

### Rust - `system.rust`

The Rust persona provides expertise in:
- Proper ownership and borrowing principles to ensure memory safety
- Idiomatic use of Result and Option types for error handling
- Effective use of traits and generics for code reusability
- Following Rust naming conventions and code style
- Leveraging the type system for safety and performance
- Writing code that is zero-cost abstraction and performant
- Proper use of Cargo and the Rust ecosystem

**Auto-activation triggers:**
- File extensions: `*.rs`
- Keywords: `rust`, `cargo`

### Java - `system.java`

The Java persona provides expertise in:
- Proper object-oriented design principles and patterns
- Effective use of Java's type system and generics
- Following Java naming conventions and code style
- Appropriate exception handling and resource management
- Understanding of the Java Memory Model and garbage collection
- Leveraging the Java standard library and ecosystem effectively
- Writing clean, maintainable, and well-documented code
- Proper use of build tools like Maven or Gradle

**Auto-activation triggers:**
- File extensions: `*.java`
- Keywords: `java ` (with space), `maven`, `gradle`

### C/C++ - `system.cpp`

The C/C++ persona provides expertise in:
- Proper memory management and avoiding memory leaks
- Understanding of pointers, references, and RAII principles
- Effective use of the C++ Standard Library and modern C++ features
- Following C/C++ naming conventions and code style
- Writing efficient and performance-optimized code
- Proper header organization and include guards
- Understanding of compilation, linking, and build systems
- Safe coding practices to avoid common vulnerabilities
- Appropriate use of C++ features like templates, lambdas, and smart pointers

**Auto-activation triggers:**
- File extensions: `*.cpp`, `*.cxx`, `*.cc`, `*.c++`, `*.h`, `*.hpp`
- Keywords: `c++`, `cpp`, `cmake`

### TypeScript - `system.typescript`

The TypeScript persona provides expertise in:
- Modern TypeScript features and syntax
- Type safety and advanced type system usage
- Integration with JavaScript ecosystems
- Best practices for scalable TypeScript applications
- Proper configuration and tooling setup
- ESM modules and async/await patterns

**Auto-activation triggers:**
- File extensions: `*.ts`, `*.tsx`
- Keywords: `typescript`, `ts ` (with space)

### Python - `system.python`

The Python persona provides expertise in:
- PEP 8 compliant code style and conventions
- Pythonic programming patterns and idioms
- Proper use of Python's standard library
- Type hints and modern Python features
- Package management and virtual environments
- Performance optimization and best practices
- Clean, readable, and maintainable code structure

**Auto-activation triggers:**
- File extensions: `*.py`, `*.pyi`
- Keywords: `python`, `pip`, `conda`, `virtualenv`

## Automatic Activation

GenAIScript automatically detects when to include language personas based on:

1. **File extensions** in your script's file processing
2. **Keywords** in your script content
3. **Build tool references** (cargo, maven, gradle, cmake)

For example, this script will automatically include the Go persona:

```js
script({
    title: "Go Code Review",
    files: "*.go"
})

$`Review this Go code and suggest improvements.`
```

## Manual Activation

You can also explicitly activate language personas using the `system` parameter:

```js
script({
    title: "Multi-language Review",
    system: ["system.go", "system.rust", "system.java"]
})

$`Compare implementations across Go, Rust, and Java.`
```

## Example Usage

### Go Code Analysis

```js title="go-review.genai.mts"
script({
    title: "Go Code Review",
    description: "Review Go code for best practices",
    files: "*.go"
})

$`Analyze the Go code and provide suggestions for:
- Error handling patterns
- Goroutine and channel usage  
- Code organization and naming conventions
- Performance optimizations`
```

### Rust Safety Check

```js title="rust-safety.genai.mts"
script({
    title: "Rust Safety Analysis", 
    files: "*.rs"
})

$`Review this Rust code focusing on:
- Ownership and borrowing correctness
- Memory safety guarantees
- Proper use of Result and Option types
- Performance implications`
```

### Java Architecture Review

```js title="java-architecture.genai.mts"
script({
    title: "Java Architecture Review",
    files: "**/*.java"
})

$`Analyze the Java codebase for:
- Object-oriented design principles
- Design pattern usage
- Exception handling strategies
- Performance and memory considerations`
```

### C++ Modernization

```js title="cpp-modernize.genai.mts"
script({
    title: "C++ Modernization",
    files: ["*.cpp", "*.h", "*.hpp"]
})

$`Review this C++ code and suggest modernizations:
- Use of modern C++ features (C++11/14/17/20)
- Memory safety with smart pointers
- Performance optimizations
- Best practices for headers and includes`
```

### TypeScript Type Safety

```js title="typescript-types.genai.mts"
script({
    title: "TypeScript Type Safety Review",
    files: "*.ts"
})

$`Review this TypeScript code focusing on:
- Type safety and proper type annotations
- Advanced TypeScript features usage
- Integration with JavaScript libraries
- Performance and compilation optimizations`
```

### Python Code Quality

```js title="python-quality.genai.mts" 
script({
    title: "Python Code Quality Review",
    files: "*.py"
})

$`Analyze this Python code for:
- PEP 8 compliance and style
- Pythonic patterns and idioms
- Type hints and modern Python features
- Performance and best practices`
```

## Combining with Other Systems

Language personas work well with other system prompts:

```js
script({
    title: "Comprehensive Code Review",
    system: ["system.go", "system.git_info", "system.diff"],
    files: "*.go"
})

$`Review the Git changes to Go files and provide detailed feedback.`
```

The language personas enhance GenAIScript's ability to provide expert-level guidance tailored to each programming language's unique characteristics and best practices.