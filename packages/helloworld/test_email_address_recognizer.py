import unittest
from email_address_recognizer import is_valid_email_or_url

class TestEmailAddressRecognizer(unittest.TestCase):

    def test_valid_email(self):
        self.assertTrue(is_valid_email_or_url("john.doe@example.com"))

    def test_valid_url(self):
        self.assertTrue(is_valid_email_or_url("https://www.example.com"))

    def test_invalid_email(self):
        self.assertFalse(is_valid_email_or_url("john.doe@.com"))

    def test_invalid_url(self):
        self.assertFalse(is_valid_email_or_url("https:/www.example.com"))

    def test_mixed_input(self):
        self.assertFalse(is_valid_email_or_url("john.doe@example.comhttps://www.example.com"))

if __name__ == '__main__':
    unittest.main()
