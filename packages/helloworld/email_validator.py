import re

 def is_valid_email(email):
     # Define a simple email regex pattern
     pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, url) is not None
