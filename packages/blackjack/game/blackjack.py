import random

class Card:
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value

    def __str__(self):
        return f"{self.value} of {self.suit}"

class Deck:
    def __init__(self):
        self.cards = [Card(suit, value) for suit in ["Hearts", "Diamonds", "Clubs", "Spades"]
                      for value in range(1, 14)]

    def shuffle(self):
        random.shuffle(self.cards)

    def draw(self):
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
            if card.value == 1:
                aces += 1
                value += 11
            elif card.value > 10:
                value += 10
            else:
                value += card.value

        while value > 21 and aces > 0:
            value -= 10
            aces -= 1

        return value

class Player:
    def __init__(self, money):
        self.money = money
        self.hand = Hand()

    def place_bet(self, amount):
        self.money -= amount
        return amount

    def receive_winnings(self, amount):
        self.money += amount

class Dealer:
    def __init__(self):
        self.hand = Hand()

    def play_turn(self, deck):
        while self.hand.calculate_value() < 17:
            self.hand.add_card(deck.draw())

def play_blackjack():
    player = Player(100)
    dealer = Dealer()
    deck = Deck()

    while player.money > 0:
        deck.shuffle()
        player.hand = Hand()
        dealer.hand = Hand()

        bet = int(input(f"You have ${player.money}. How much would you like to bet? "))
        player.place_bet(bet)

        player.hand.add_card(deck.draw())
        player.hand.add_card(deck.draw())
        dealer.hand.add_card(deck.draw())
        dealer.hand.add_card(deck.draw())

        print(f"Your hand: {', '.join(str(card) for card in player.hand.cards)}")
        print(f"Dealer's up card: {dealer.hand.cards[0]}")

        while True:
            action = input("Do you want to hit or stand? ").lower()
            if action == "hit":
                player.hand.add_card(deck.draw())
                print(f"Your hand: {', '.join(str(card) for card in player.hand.cards)}")
                if player.hand.calculate_value() > 21:
                    print("You bust! You lose.")
                    break
            elif action == "stand":
                dealer.play_turn(deck)
                print(f"Dealer's hand: {', '.join(str(card) for card in dealer.hand.cards)}")
                if dealer.hand.calculate_value() > 21:
                    print("Dealer busts! You win!")
                    player.receive_winnings(bet * 2)
                elif dealer.hand.calculate_value() > player.hand.calculate_value():
                    print("Dealer wins!")
                elif dealer.hand.calculate_value() < player.hand.calculate_value():
                    print("You win!")
                    player.receive_winnings(bet * 2)
                else:
                    print("It's a tie!")
                    player.receive_winnings(bet)
                break

        if input("Do you want to play again? (yes/no) ").lower() == "no":
            break

if __name__ == "__main__":
    play_blackjack()
