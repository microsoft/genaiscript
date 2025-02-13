#include <iostream>

int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    int n = 10; // Example input
    std::cout << "Fibonacci of " << n << " is " << fibonacci(n) << std::endl;
    return 0;
}