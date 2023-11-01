# Language and Framework
- Python 3.8+
- No additional frameworks required

# Directory Structure
- blackjack/
  - __init__.py
  - game.py
  - deck.py
  - player.py
  - dealer.py
  - cli.py

# Instructions for Software Developer
- Implement the command line interface for the blackjack application based on the architecture provided.
- Develop the main components and their APIs as specified.
- Ensure the application allows users to place bets, be dealt multiple hands, and quit the game.
- Implement the dealer logic, standing on 17 and above, and drawing on anything less.

# Invariants
- The sum of cards for a player or dealer cannot be greater than 21.
- A player cannot bet more money than they have.

# Components

## File: ./blackjack/game.py
- Imports: deck, player, dealer
- Exports: Game class
- API:
  - `Game`: Class representing the game state and logic.
    - `__init__(self, player: player.Player, dealer: dealer.Dealer)`: Initialize the game with a player and dealer.
    - `place_bet(self, amount: int)`: Place a bet for the player.
    - `deal(self)`: Deal a new hand to the player and dealer.
    - `player_turn(self)`: Execute the player's turn.
    - `dealer_turn(self)`: Execute the dealer's turn.
    - `determine_winner(self)`: Determine the winner of the current hand.
    - `reset(self)`: Reset the game state for a new hand.

## File: ./blackjack/deck.py
- Imports: None
- Exports: Deck class
- API:
  - `Deck`: Class representing a deck of cards.
    - `__init__(self)`: Initialize a new deck of cards.
    - `shuffle(self)`: Shuffle the deck.
    - `draw(self)`: Draw a card from the top of the deck.

## File: ./blackjack/player.py
- Imports: None
- Exports: Player class
- API:
  - `Player`: Class representing a player.
    - `__init__(self, money: int)`: Initialize the player with a starting amount of money.
    - `bet(self, amount: int)`: Deduct the bet amount from the player's money.
    - `win(self, amount: int)`: Add the winning amount to the player's money.
    - `hand_value(self)`: Calculate the value of the player's hand.

## File: ./blackjack/dealer.py
- Imports: None
- Exports: Dealer class
- API:
  - `Dealer`: Class representing the dealer.
    - `hand_value(self)`: Calculate the value of the dealer's hand.
    - `should_draw(self)`: Determine if the dealer should draw another card.

## File: ./blackjack/cli.py
- Imports: game, player, dealer
- Exports: main function
- API:
  - `main()`: Command line client for the blackjack game.
    - Initialize a new game with a player and dealer.
    - Prompt the user for input to place bets, deal hands, and quit the game.
    - Display the game state and results after each action.
