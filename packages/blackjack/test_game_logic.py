import unittest
from game_logic import GameLogic

class TestGameLogic(unittest.TestCase):
    def setUp(self):
        self.game_logic = GameLogic()

    def test_deal_initial_cards(self):
        # Test dealing two cards to the player and dealer
        self.game_logic.deal_initial_cards()
        self.assertEqual(len(self.game_logic.player_hand), 2)
        self.assertEqual(len(self.game_logic.dealer_hand), 2)

    def test_player_turn(self):
        # Test handling the player's turn, allowing them to hit or stand
        # TODO: Implement test for player_turn() method
        pass

    def test_dealer_turn(self):
        # Test handling the dealer's turn, following the rules of standing on 17 and above and drawing on anything less
        # TODO: Implement test for dealer_turn() method
        pass

    def test_calculate_winner(self):
        # Test determining the winner of the round and updating the player's money
        # TODO: Implement test for calculate_winner() method
        pass

if __name__ == '__main__':
    unittest.main()
