script({
    title: "C/C++ Code Helper",
    description: "Generate C/C++ code with best practices",
    files: ["*.c", "*.cpp", "*.cxx", "*.cc", "*.h", "*.hpp"]
})

$`Analyze the C/C++ code and provide suggestions for improvement using the annotation format. Consider:
- Memory management and RAII principles
- Pointer safety and smart pointers
- Modern C++ features and best practices
- Performance optimization
- Code organization and header management`