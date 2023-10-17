import re
from urllib.parse import urlparse

def is_valid_email(input_string):
    """
    Check if the given string is a valid email address.

    Args:
        input_string (str): The string to check for a valid email address.

    Returns:
        bool: True if the string is a valid email address, False otherwise.
    """
    email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.fullmatch(email_pattern, input_string))

def is_valid_url(input_string):
    """
    Check if the given string is a valid URL.

    Args:
        input_string (str): The string to check for a valid URL.

    Returns:
        bool: True if the string is a valid URL, False otherwise.
    """
    try:
        result = urlparse(input_string)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

def is_valid_email_or_url(input_string):
    """
    Check if the given string is a valid email address or URL.

    Args:
        input_string (str): The string to check for a valid email address or URL.

    Returns:
        bool: True if the string is a valid email address or URL, False otherwise.
    """
    return is_valid_email(input_string) or is_valid_url(input_string)
