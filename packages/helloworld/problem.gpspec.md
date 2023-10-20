# email address and URL recognizer

Write a function that takes a string argument and returns true if the whole string is a valid email address or URL, false otherwise.

-   [email_recognizer.py](email_recognizer.py)

## Code Review

1. Add a docstring to the `is_valid_email` function to explain its purpose, input, and output.
2. Consider using a more descriptive variable name for the regex pattern, such as `email_pattern`.
3. The regex pattern can be compiled once outside the function to improve performance.
4. Add test cases to validate the function's behavior with various email addresses.
- use the `email_recognizer.py` file to emit code