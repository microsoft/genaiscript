import re
from urllib.parse import urlparse

def is_email_or_url(input_str):
    """
    Check if the given string is a valid email address or URL.

    Args:
    input_str (str): The string to check for email or URL validity.

    Returns:
    bool: True if the string is a valid email address or URL, False otherwise.
    """
    email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    email_regex = re.compile(email_pattern)
    is_email = bool(email_regex.match(input_str))

    url_parsed = urlparse(input_str)
    is_url = bool(url_parsed.scheme and url_parsed.netloc and url_parsed.scheme in ['http', 'https'])

    return is_email or is_url
