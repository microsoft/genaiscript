import re

def is_valid_email(email: str) -> bool:
    """
    Takes a string argument and returns true if the whole string is a valid email address, false otherwise.
    
    Args:
    email (str): The email address to be validated.

    Returns:
    bool: True if the email address is valid, False otherwise.
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))
