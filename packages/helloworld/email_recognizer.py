import re

def is_valid_email(email):
    if re.fullmatch(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", email):
        return True
    else:
        return False
