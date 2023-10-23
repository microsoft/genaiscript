import sys
import re

def is_valid_input(input_str: str) -> bool:
    """
    Check if the given input string is a valid email address or URL.

    :param input_str: The input string to validate.
    :return: True if the input is valid, False otherwise.
    """
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    url_pattern = r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+"
    return bool(re.match(email_pattern, input_str) or re.match(url_pattern, input_str))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_str = sys.argv[1]
        print(is_valid_input(input_str))
    else:
        print("Usage: python problem1.py <email_address_or_url>")
