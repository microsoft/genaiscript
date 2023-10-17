# email address or URL recognizer

Write a function that takes a string argument and returns true if the whole string is a valid email address or URL, false otherwise.

-   [email_address_recognizer.py](email_address_recognizer.py)

-   [test_email_address_recognizer.py](test_email_address_recognizer.py)

## Code Review

1. The function only checks for valid email addresses, not URLs. Add a separate function to check for valid URLs and combine the results.
2. Use `re.fullmatch()` instead of `re.match()` to ensure the entire string is matched.
3. Add test cases to validate the function's behavior with various email addresses and URLs.
4. Import only the required functions from the `re` module, such as `fullmatch`, to improve code readability.
5. Use raw string notation for the regular expression patterns to avoid potential issues with escape sequences.
6. Consider using more comprehensive regular expression patterns for email and URL validation.
