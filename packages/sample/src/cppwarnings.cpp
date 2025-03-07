// cppwarnings.cpp
#include <iostream>
#include <vector>

// Unused function example
int unused_function() {
    return 42;
}

int main() {
    // Demonstrating a vector declaration to ensure warning-free code
    std::vector<int> example_vector = {1, 2, 3};

    // Output results for debug purposes
    std::cout << "Example vector size: " << example_vector.size() << std::endl;

    return 0;
}
