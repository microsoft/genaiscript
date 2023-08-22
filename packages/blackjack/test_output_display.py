import unittest
from output_display import OutputDisplay

class TestOutputDisplay(unittest.TestCase):
    def setUp(self):
        self.output_display = OutputDisplay()

    def test_show_initial_cards(self):
        # Test displaying the initial cards dealt to the player and dealer
        # TODO: Implement test for show_initial_cards() method
        pass

    def test_show_turn_result(self):
        # Test displaying the result of a player's or dealer's turn (hit or stand)
        # TODO: Implement test for show_turn_result() method
        pass

    def test_show_round_result(self):
        # Test displaying the result of the round (win, lose, or draw) and the player's updated money
        # TODO: Implement test for show_round_result() method
        pass

    def test_show_quit_message(self):
        # Test displaying a message when the player quits the game
        # TODO: Implement test for show_quit_message() method
        pass

if __name__ == '__main__':
    unittest.main()
