# email address and URL recognizer 

-   [generate-python](./problem.py)

-   [generate-python-tests](./problem.pyt)

## Write a function that takes a string argument and returns true if the whole string is a valid email address or URL, false otherwise.

- Include a way to call the function from the command line

## Pay attention to these issues

Issue: 
  File "C:\projects\coarch\packages\helloworld\problem.py", line 11, in <module>
    email = sys.argv[1]
  IndexError: list index out of range

Make sure this URLs cant contain a dollar sign.
  FAIL: test_invalid_url_special_characters (__main__.TestIsValidEmailOrUrl)
  ----------------------------------------------------------------------
  Traceback (most recent call last):
    File "C:\projects\coarch\packages\helloworld\problem.pyt", line 31, in test_invalid_url_special_characters
      self.assertFalse(is_valid_email_or_url("https://www.exa$mple.com"))
  AssertionError: True is not false

