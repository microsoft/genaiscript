import unittest
from problem1 import is_valid_email

class TestIsValidEmail(unittest.TestCase):

    def test_valid_email(self):
        self.assertTrue(is_valid_email("example@example.com"))

    def test_invalid_email_missing_at(self):
        self.assertFalse(is_valid_email("exampleexample.com"))

    def test_invalid_email_missing_domain(self):
        self.assertFalse(is_valid_email("example@"))

    def test_invalid_email_missing_username(self):
        self.assertFalse(is_valid_email("@example.com"))

    def test_invalid_email_special_characters(self):
        self.assertFalse(is_valid_email("example@exa$mple.com"))

if __name__ == "__main__":
    unittest.main()
