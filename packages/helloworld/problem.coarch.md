# email address and URL recognizer 

Write a function that takes a string argument and returns true if the whole string is a valid email address or URL, false otherwise.

-   [./email_recognizer.py](././email_recognizer.py)

-   [./test_email_recognizer.py](././test_email_recognizer.py)

## Code Review

1. Add docstring to the `is_valid_email` function to explain its purpose and parameters.
2. Use a more descriptive variable name instead of `pattern` for the regex pattern.
3. Consider using a more comprehensive regex pattern to cover edge cases and improve email validation.
4. Add unit tests in `test_email_recognizer.py` to ensure the function works as expected.
5. The function only checks for email addresses, not URLs. Update the function to also validate URLs.
6. Rename the function to better reflect its purpose, e.g., `is_valid_email_or_url`.
