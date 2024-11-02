class Greeter {
    greeting: string

    constructor(message: string) {
        this.greeting = message
    }

    greet() {
        return "Hello, " + this.greeting
    }
}

interface IGreeter {
    greeting: string
    greet(): string
}

export function hello() {}

let greeter = new Greeter("world")
