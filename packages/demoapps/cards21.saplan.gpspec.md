# Architecture Plan for Command Line Application - 21 Card Game

## Programming Language and Framework

The programming language chosen for this application is Python. Python is a high-level, interpreted language that is easy to read and write. It also has a rich set of libraries which can be used to build this application.

## Instructions for Software Developer

The software developer should follow the architecture plan provided in this document to implement the command line application. The code should be placed in a single file named cards21.py. The developer should ensure that the code meets all the requirements stated in the Idea and Additional Requirements sections of the product idea.

## Invariants

- The player cannot bet more money than they have.
- The dealer must always stand on 17 and above and draw on anything less.
- The dealer wins when there is a tie.

## Components

### 1. Card

This component represents a playing card. It should have properties for suit and value.

API:
- `__init__(self, suit, value)`: Initializes a new card with the given suit and value.
- `__str__(self)`: Returns a string representation of the card.

### 2. Deck

This component represents a deck of cards. It should have methods to shuffle the deck and deal a card.

API:
- `__init__(self)`: Initializes a new deck of cards.
- `shuffle(self)`: Shuffles the deck.
- `deal(self)`: Deals a card from the deck.

### 3. Hand

This component represents a hand of cards. It should have methods to add a card to the hand and calculate the total value of the hand.

API:
- `__init__(self)`: Initializes a new hand.
- `add_card(self, card)`: Adds a card to the hand.
- `calculate_value(self)`: Calculates the total value of the hand.

### 4. Player

This component represents a player. It should have properties for the player's hand and money. It should have methods to place a bet, receive a card, and check if the player has busted.

API:
- `__init__(self, money)`: Initializes a new player with the given amount of money.
- `place_bet(self, amount)`: Places a bet of the given amount.
- `receive_card(self, card)`: Receives a card and adds it to the player's hand.
- `is_busted(self)`: Checks if the player has busted.

### 5. Dealer

This component represents the dealer. It should have properties for the dealer's hand. It should have methods to receive a card and check if the dealer should draw a card.

API:
- `__init__(self)`: Initializes a new dealer.
- `receive_card(self, card)`: Receives a card and adds it to the dealer's hand.
- `should_draw(self)`: Checks if the dealer should draw a card.

### 6. Game

This component represents the game. It should have methods to start the game, handle a round, and end the game.

API:
- `__init__(self, player, dealer, deck)`: Initializes a new game with the given player, dealer, and deck.
- `start(self)`: Starts the game.
- `handle_round(self)`: Handles a round of the game.
- `end(self)`: Ends the game.

## Command Line Client

The command line client should interact with the Game component to play the game. It should provide prompts for the user to place a bet, display the player's and dealer's hands, and display the result of each round. It should also handle user input and catch any errors.
API: `Card.get_value()`, `Card.get_suit()`

### deck.py

This module represents a deck of cards. It creates a deck and allows cards to be drawn from it.

Imports: `card.py`

Exports: `Deck`

API: `Deck.draw()`

## Command Line Client

The command line client is implemented in `main.py`. It uses the `game.py` module to start the game and handle user input. The client should be easy to use and well documented.
