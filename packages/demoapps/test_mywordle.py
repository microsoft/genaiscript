import unittest
from unittest.mock import patch
from mywordle import UserInputComponent, GameLogicComponent, UserFeedbackComponent, CommandLineClient

class TestMyWordle(unittest.TestCase):
    def setUp(self):
        self.client = CommandLineClient()

    @patch('builtins.input', return_value='apple')
    def test_user_input_component(self, input):
        user_input = self.client.user_input_component.get_input()
        self.assertEqual(user_input, 'apple')

    def test_game_logic_component(self):
        hidden_word = self.client.game_logic_component.pick_word()
        self.assertIn(hidden_word, self.client.user_input_component.legal_words)

        feedback = self.client.game_logic_component.compare_words('apple', 'apple')
        self.assertEqual(feedback, '[a][p][p][l][e]')

    @patch('builtins.print')
    def test_user_feedback_component(self, mock_print):
        self.client.user_feedback_component.show_feedback('apple')
        mock_print.assert_called_once_with('apple')

    @patch('builtins.input', return_value='apple')
    def test_command_line_client(self, input):
        self.client.start_game()
        self.assertEqual(self.client.guesses, 0)
        self.assertIn(self.client.hidden_word, self.client.user_input_component.legal_words)

        self.client.hidden_word = 'apple'
        self.assertTrue(self.client.guess_word())

        self.client.guesses = 6
        self.assertTrue(self.client.guess_word())

if __name__ == '__main__':
    unittest.main()
