import unittest
from user_input import UserInput

class TestUserInput(unittest.TestCase):
    def setUp(self):
        self.user_input = UserInput()

    def test_get_bet(self):
        # Test getting the player's bet for the round
        # TODO: Implement test for get_bet() method
        pass

    def test_get_action(self):
        # Test getting the player's action (hit or stand) during their turn
        # TODO: Implement test for get_action() method
        pass

    def test_quit_game(self):
        # Test checking if the player wants to quit the game
        # TODO: Implement test for quit_game() method
        pass

if __name__ == '__main__':
    unittest.main()
