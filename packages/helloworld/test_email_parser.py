import unittest
from email_parser import is_email_or_url

class TestEmailUrlParser(unittest.TestCase):

    def test_valid_email(self):
        self.assertTrue(is_email_or_url("user@example.com"))

    def test_valid_url(self):
        self.assertTrue(is_email_or_url("https://www.example.com"))

    def test_invalid_email(self):
        self.assertFalse(is_email_or_url("user@.com"))

    def test_invalid_url(self):
        self.assertFalse(is_email_or_url("htp://www.example.com"))

    def test_empty_string(self):
        self.assertFalse(is_email_or_url(""))

if __name__ == '__main__':
    unittest.main()
