import random

class Card:
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value

    def __str__(self):
        return f"{self.value} of {self.suit}"

class Deck:
    def __init__(self):
        self.cards = [Card(suit, value) for suit in ["Spades", "Hearts", "Diamonds", "Clubs"]
                      for value in ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"]]
        self.shuffle()

    def shuffle(self):
        random.shuffle(self.cards)

    def deal(self):
        return self.cards.pop()

class Hand:
    def __init__(self):
        self.cards = []

    def add_card(self, card):
        self.cards.append(card)

    def calculate_value(self):
        value = 0
        aces = 0
        for card in self.cards:
            if card.value.isnumeric():
                value += int(card.value)
            elif card.value in ["Jack", "Queen", "King"]:
                value += 10
            else:
                value += 11
                aces += 1
        while value > 21 and aces:
            value -= 10
            aces -= 1
        return value

class Player:
    def __init__(self, money):
        self.money = money
        self.hand = Hand()

    def place_bet(self, amount):
        assert 0 < amount <= self.money, "Bet amount is not valid"
        self.money -= amount
        return amount

    def receive_card(self, card):
        self.hand.add_card(card)

    def is_busted(self):
        return self.hand.calculate_value() > 21

class Dealer:
    def __init__(self):
        self.hand = Hand()

    def receive_card(self, card):
        self.hand.add_card(card)

    def should_draw(self):
        return self.hand.calculate_value() < 17

class Game:
    def __init__(self, player, dealer, deck):
        self.player = player
        self.dealer = dealer
        self.deck = deck
        self.bet = 0

    def start(self):
        self.bet = self.player.place_bet(int(input("Place your bet: ")))
        for _ in range(2):
            self.player.receive_card(self.deck.deal())
            self.dealer.receive_card(self.deck.deal())
        print(f"Player's hand: {[str(card) for card in self.player.hand.cards]}")
        print(f"Dealer's visible card: {self.dealer.hand.cards[0]}")

    def handle_round(self):
        while not self.player.is_busted():
            print(f"Player's hand: {[str(card) for card in self.player.hand.cards]}")
            if input("Do you want to draw a card (yes/no)? ").lower() == "yes":
                self.player.receive_card(self.deck.deal())
            else:
                break
        while self.dealer.should_draw():
            self.dealer.receive_card(self.deck.deal())
        print(f"Player's hand: {[str(card) for card in self.player.hand.cards]}")
        print(f"Dealer's hand: {[str(card) for card in self.dealer.hand.cards]}")
        if self.player.is_busted() or self.player.hand.calculate_value() < self.dealer.hand.calculate_value() <= 21:
            print("Dealer wins!")
            return -self.bet
        else:
            print("Player wins!")
            return self.bet

    def end(self):
        print(f"Player's money: {self.player.money}")

def main():
    player = Player(100)
    dealer = Dealer()
    deck = Deck()
    game = Game(player, dealer, deck)
    game.start()
    player.money += game.handle_round()
    game.end()

if __name__ == "__main__":
    main()
