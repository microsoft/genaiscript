import unittest
from blackjack import BlackjackGame, Player, Dealer

class TestBlackjackGame(unittest.TestCase):
    def test_place_bet(self):
        game = BlackjackGame()
        player = Player()
        player.money = 100
        game.place_bet(player, 50)
        self.assertEqual(player.money, 50)

    def test_deal_hand(self):
        game = BlackjackGame()
        player = Player()
        dealer = Dealer()
        game.deal_hand(player, dealer)
        self.assertEqual(len(player.hand), 2)
        self.assertEqual(len(dealer.hand), 2)

    def test_quit_game(self):
        game = BlackjackGame()
        player = Player()
        player.money = 100
        game.quit_game(player)
        self.assertEqual(player.money, 100)

class TestDealer(unittest.TestCase):
    def test_stand_or_draw(self):
        dealer = Dealer()
        dealer.hand = [10, 6]
        action = dealer.stand_or_draw()
        self.assertEqual(action, "draw")

        dealer.hand = [10, 7]
        action = dealer.stand_or_draw()
        self.assertEqual(action, "stand")

if __name__ == '__main__':
    unittest.main()
