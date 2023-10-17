import unittest
from email_address_recognizer import is_valid_email_or_url

class TestEmailAddressRecognizer(unittest.TestCase):
    def test_valid_email(self):
        self.assertTrue(is_valid_email_or_url("test@example.com"))

    def test_invalid_email(self):
        self.assertFalse(is_valid_email_or_url("test@.com"))

    def test_valid_url(self):
        self.assertTrue(is_valid_email_or_url("https://www.example.com"))

    def test_invalid_url(self):
        self.assertFalse(is_valid_email_or_url("htp://www.example.com"))

if __name__ == '__main__':
    unittest.main()
