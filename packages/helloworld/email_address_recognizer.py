import re
from urllib.parse import urlparse

def is_valid_email(email):
    email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.fullmatch(email_pattern, email))

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

def is_valid_email_or_url(input_string):
    return is_valid_email(input_string) or is_valid_url(input_string)
