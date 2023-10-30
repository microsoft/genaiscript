import deck
import player
import dealer

class Game:
    def __init__(self, player: player.Player, dealer: dealer.Dealer):
        self.player = player
        self.dealer = dealer
        self.deck = deck.Deck()
        self.bet_amount = 0

    def place_bet(self, amount: int):
        self.bet_amount = amount
        self.player.bet(amount)

    def deal(self):
        self.deck.shuffle()
        self.player.hand = [self.deck.draw(), self.deck.draw()]
        self.dealer.hand = [self.deck.draw(), self.deck.draw()]

    def player_turn(self):
        while True:
            action = input("Enter 'h' to hit or 's' to stand: ").lower()
            if action == 'h':
                self.player.hand.append(self.deck.draw())
                print(f"Player hand: {display_hand(self.player.hand)}")
                if self.player.hand_value() > 21:
                    return False
            elif action == 's':
                return True

    def dealer_turn(self):
        while self.dealer.should_draw():
            self.dealer.hand.append(self.deck.draw())

    def determine_winner(self):
        player_value = self.player.hand_value()
        dealer_value = self.dealer.hand_value()

        if player_value > 21:
            return "dealer"
        elif dealer_value > 21:
            return "player"
        elif player_value > dealer_value:
            return "player"
        elif dealer_value > player_value:
            return "dealer"
        else:
            return "tie"

    def reset(self):
        self.deck = deck.Deck()
        self.bet_amount = 0
        self.player.hand = []
        self.dealer.hand = []

def display_hand(hand):
    return ', '.join(str(card).capitalize() for card in hand)
