---
title: Python Email Validation Guide with GPTools
description: Learn how to enhance a Python function for email validation using GPTools. This guide covers error handling, command line argument handling, and test cases.
keywords: Python, Email Validation, GPTools, Regex, Command Line Arguments
---
# Hello world GPTools

This sample contains a few gptools and started gpspec files to get started.

## Python generation demo

1. Add a docstring to the `is_valid_email` function to explain its purpose and parameters.
2. Use a compiled regex pattern for better performance.
3. Use argparse for better command line argument handling and help messages.
4. Add error handling for invalid input.
5. Add test cases to ensure the function works as expected.

Here's the improved code:

```python
import re
import sys
import argparse

def is_valid_email(email: str) -> bool:
    """
    Check if the given string is a valid email address.

    :param email: The string to be checked.
    :return: True if the string is a valid email address, False otherwise.
    """
    # Regular expression for validating an email
    email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(email_regex.match(email))

def main():
    parser = argparse.ArgumentParser(description="Check if a given string is a valid email address.")
    parser.add_argument("email", help="The email address to be checked.")
    args = parser.parse_args()

    try:
        print(is_valid_email(args.email))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
```

Test cases:

```python
def test_is_valid_email():
    assert is_valid_email("test@example.com") == True
    assert is_valid_email("test+123@example.co.uk") == True
    assert is_valid_email("test@subdomain.example.com") == True
    assert is_valid_email("test@.com") == False
    assert is_valid_email("test@example") == False
    assert is_valid_email("test@.com") == False
    assert is_valid_email("test@.com") == False

test_is_valid_email()
```

```


### Extracted Variables

-   `*`
```

import re
import sys
import argparse

def is_valid_email(email: str) -> bool:
"""
Check if the given string is a valid email address.

    :param email: The string to be checked.
    :return: True if the string is a valid email address, False otherwise.
    """
    # Regular expression for validating an email
    email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(email_regex.match(email))

def main():
parser = argparse.ArgumentParser(description="Check if a given string is a valid email address.")
parser.add_argument("email", help="The email address to be checked.")
args = parser.parse_args()

    try:
        print(is_valid_email(args.email))
    except Exception as e:
        print(f"Error: {e}")

if **name** == "**main**":
main()
def test_is_valid_email():
assert is_valid_email("test@example.com") == True
assert is_valid_email("test+123@example.co.uk") == True
assert is_valid_email("test@subdomain.example.com") == True
assert is_valid_email("test@.com") == False
assert is_valid_email("test@example") == False
assert is_valid_email("test@.com") == False
assert is_valid_email("test@.com") == False

test_is_valid_email()

```

-   remaining
```

1. Add a docstring to the `is_valid_email` function to explain its purpose and parameters.
2. Use a compiled regex pattern for better performance.
3. Use argparse for better command line argument handling and help messages.
4. Add error handling for invalid input.
5. Add test cases to ensure the function works as expected.

Here's the improved code:

Test cases:
