# email address or URL recognizer

Write a function that takes a string argument and returns true if the whole string is a valid email address or URL, false otherwise. Use `email_address_recognizer.py`.

-   [email_address_recognizer.py](email_address_recognizer.py)

-   [test_email_address_recognizer.py](test_email_address_recognizer.py)

## Code Review

1. Add a docstring to functions
2. use `re.fullmatch`
3. The function only checks for email addresses, not URLs. Add a separate function to check for valid URLs and combine the results.
4. Consider using more comprehensive regex patterns for email and URL validation.
5. Add test cases in `test_email_address_recognizer.py` to ensure the function works as expected.
