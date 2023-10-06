import re

def is_valid_email_or_url(input_str: str) -> bool:
    """Check if the input string is a valid email address or URL."""
    if not isinstance(input_str, str):
        return False

    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    url_regex = r'^(https?|ftp)://[^\s/$.?#].[^\s]*$'
    return bool(re.match(email_regex, input_str) or re.match(url_regex, input_str))
