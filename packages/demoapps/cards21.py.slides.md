### Introduction to cards21.py
- This slide deck will walk you through the Python script `cards21.py`.
- The script simulates a game of Blackjack, also known as 21.

---

### Class Definitions
- The script defines several classes: `Card`, `Deck`, `Hand`, `Player`, `Dealer`, and `Game`.
- These classes model the different components and actors in a game of Blackjack.

---

### The Card Class
- The `Card` class represents a playing card.
- It has two attributes: `suit` and `value`.

```python
class Card:
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value

    def __str__(self):
        return f"{self.value} of {self.suit}"
        self.suit = suit
        self.value = value
```

---

### Slide: Deck Class

The `Deck` class represents a deck of cards. It initializes a standard deck of 52 cards and provides methods to shuffle and deal cards.

```python
class Deck:
    def __init__(self):
        self.cards = [Card(suit, value) for suit in ["Spades", "Hearts", "Diamonds", "Clubs"]
                      for value in ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"]]
        self.shuffle()
    ...
```

---

### Slide: Hand Class

The `Hand` class represents a hand of cards. It provides methods to add a card to the hand and calculate the total value of the hand.

```python
class Hand:
    def __init__(self):
        self.cards = []
    ...
```

---

### Slide: Player Class

The `Player` class represents a player in the game. It keeps track of the player's money, hand of cards, and provides methods to place a bet, receive a card, and check if the player is busted.

```python
class Player:
    def __init__(self, money):
        self.money = money
        self.hand = Hand()
    ...
```

---

### Slide: Dealer Class

The `Dealer` class represents the dealer in the game. It keeps track of the dealer's hand of cards and provides methods to receive a card and decide whether to draw another card.

```python
class Dealer:
    def __init__(self):
        self.hand = Hand()
    ...
```

---

### Slide: Game Class

The `Game` class represents a game of Blackjack. It initializes a game with a player, a dealer, and a deck of cards, and provides methods to start the game, handle a round, and end the game.

```python
class Game:
    def __init__(self, player, dealer, deck):
        self.player = player
        self.dealer = dealer
        self.deck = deck
        self.bet = 0
    ...
```

---

### Slide: Main Function

The `main` function creates instances of the `Player`, `Dealer`, `Deck`, and `Game` classes, starts the game, handles a round, and ends the game.

```python
def main():
    player = Player(100)
    dealer = Dealer()
    deck = Deck()
    game = Game(player, dealer, deck)
    game.start()
    player.money += game.handle_round()
    game.end()
```

---

### Slide: Running the Script

Finally, the script checks if it is being run directly (not imported as a module), and if so, it calls the `main` function to start the game.

```python
if __name__ == "__main__":
    main()
```

    def start(self):
        self.bet = self.player.place_bet(int(input("Place your bet: ")))
        for _ in range(2):
            self.player
