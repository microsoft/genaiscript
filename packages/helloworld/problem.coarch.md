# email address and URL recognizer 

Write a function that takes a string argument and returns true if the whole string is a valid email address or URL, false otherwise.

-   [./email_recognizer.py](././email_recognizer.py)

-   [./test_email_recognizer.py](././test_email_recognizer.py)

## Code Review

1. Add type hinting for the input argument and return type of the function.
2. Use more descriptive variable names for the regex patterns.
3. Handle the case when the input string is `None` or not a string type.
4. Add docstrings to explain the purpose and usage of the function.
5. Update the function to handle the case when the input is `None` and return `False`. To fix the runtime error, add a condition to check if the input is a string before performing the regex match.
