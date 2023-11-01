import unittest
from cards21 import Card, Deck, Hand, Player, Dealer, Game

class TestCard(unittest.TestCase):
    def setUp(self):
        self.card = Card("Hearts", "Ace")

    def test_str(self):
        self.assertEqual(str(self.card), "Ace of Hearts")

class TestDeck(unittest.TestCase):
    def setUp(self):
        self.deck = Deck()

    def test_deal(self):
        card = self.deck.deal()
        self.assertIsInstance(card, Card)
        self.assertEqual(len(self.deck.cards), 51)

class TestHand(unittest.TestCase):
    def setUp(self):
        self.hand = Hand()

    def test_add_card(self):
        card = Card("Hearts", "Ace")
        self.hand.add_card(card)
        self.assertEqual(len(self.hand.cards), 1)

    def test_calculate_value(self):
        self.hand.add_card(Card("Hearts", "Ace"))
        self.hand.add_card(Card("Spades", "King"))
        self.assertEqual(self.hand.calculate_value(), 21)

class TestPlayer(unittest.TestCase):
    def setUp(self):
        self.player = Player(100)

    def test_place_bet(self):
        self.assertEqual(self.player.place_bet(50), 50)
        self.assertEqual(self.player.money, 50)

    def test_receive_card(self):
        card = Card("Hearts", "Ace")
        self.player.receive_card(card)
        self.assertEqual(len(self.player.hand.cards), 1)

    def test_is_busted(self):
        self.player.receive_card(Card("Hearts", "Ace"))
        self.player.receive_card(Card("Spades", "King"))
        self.player.receive_card(Card("Diamonds", "2"))
        self.assertTrue(self.player.is_busted())

class TestDealer(unittest.TestCase):
    def setUp(self):
        self.dealer = Dealer()

    def test_receive_card(self):
        card = Card("Hearts", "Ace")
        self.dealer.receive_card(card)
        self.assertEqual(len(self.dealer.hand.cards), 1)

    def test_should_draw(self):
        self.dealer.receive_card(Card("Hearts", "Ace"))
        self.dealer.receive_card(Card("Spades", "King"))
        self.assertTrue(self.dealer.should_draw())

class TestGame(unittest.TestCase):
    def setUp(self):
        self.player = Player(100)
        self.dealer = Dealer()
        self.deck = Deck()
        self.game = Game(self.player, self.dealer, self.deck)

    def test_start(self):
        self.game.start()
        self.assertEqual(len(self.player.hand.cards), 2)
        self.assertEqual(len(self.dealer.hand.cards), 2)

    def test_handle_round(self):
        self.game.start()
        self.game.handle_round()
        self.assertTrue(self.player.is_busted() or self.dealer.is_busted())

    def test_end(self):
        self.game.start()
        self.game.handle_round()
        self.game.end()
        self.assertTrue(self.player.money >= 0)

if __name__ == "__main__":
    unittest.main()
