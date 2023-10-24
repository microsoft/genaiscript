# Email and URL address recognizer

Write a python function that takes a string and returns true if it is an email or an URL; false otherwise.
-   [email_parser.py](email_parser.py)
-   [test_email_parser.py](test_email_parser.py)
-   use a builtin parser to validate the url pattern
-   save code in `email_parser.py`

## Code Review

1. Add a docstring to the `is_email` function to explain its purpose and usage.
2. Use a more descriptive variable name instead of `s` for the input string.
3. Consider using a compiled regular expression for better performance.
4. Add test cases to ensure the function works as expected.

## Errors

Fix this runtime errors

```
test_email_parser.TestEmailUrlParser.test_invalid_url failed: <class 'AssertionError'> True is not false
Traceback (most recent call last):
  File "/home/codespace/.python/current/lib/python3.10/unittest/case.py", line 59, in testPartExecutor
    yield
  File "/home/codespace/.python/current/lib/python3.10/unittest/case.py", line 591, in run
    self._callTestMethod(testMethod)
  File "/home/codespace/.python/current/lib/python3.10/unittest/case.py", line 549, in _callTestMethod
    method()
  File "/workspaces/coarch/packages/helloworld/test_email_parser.py", line 16, in test_invalid_url
    self.assertFalse(is_email_or_url("htp://www.example.com"))
AssertionError: True is not false
```