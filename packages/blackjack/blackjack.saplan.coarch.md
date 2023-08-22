# Command Line Blackjack Application Architecture

-   [SDE-coding](./repro4.saplan.py)


## Language and Framework
- Programming Language: Python
- Framework: None (Command Line Application)

## Directory Structure
- blackjack/
  - main.py
  - game_logic.py
  - user_input.py
  - output_display.py

## Instructions for Software Developer (SDE)
1. Implement the command line interface for user input, allowing players to place bets, be dealt hands, and quit the game.
2. Develop the game logic, including the dealer's rules (standing on 17 and above, drawing on anything less) and handling player's actions (placing bets, being dealt multiple hands, and quitting).
3. Create output display components to show the dealer's actions and the player's money after each round.
4. Integrate all components and ensure they interact correctly according to the software architecture.

## Invariants
- The sum of a player's or dealer's cards cannot be greater than 21.
- The dealer must stand on 17 and above and draw on anything less.
- The player's money cannot be negative.

## Components

### main.py
- Imports: game_logic, user_input, output_display
- Exports: None
- API: None
- Description: The main entry point for the command line application. It initializes the game, handles user input, game logic, and output display.

### game_logic.py
- Imports: None
- Exports: GameLogic class
- API:
  - `GameLogic.deal_initial_cards()`: Deal two cards to the player and dealer.
  - `GameLogic.player_turn()`: Handle the player's turn, allowing them to hit or stand.
  - `GameLogic.dealer_turn()`: Handle the dealer's turn, following the rules of standing on 17 and above and drawing on anything less.
  - `GameLogic.calculate_winner()`: Determine the winner of the round and update the player's money.
- Description: This module contains the game logic, including dealing cards, handling turns, and determining the winner.

### user_input.py
- Imports: None
- Exports: UserInput class
- API:
  - `UserInput.get_bet()`: Get the player's bet for the round.
  - `UserInput.get_action()`: Get the player's action (hit or stand) during their turn.
  - `UserInput.quit_game()`: Check if the player wants to quit the game.
- Description: This module handles user input, allowing the player to place bets, choose actions during their turn, and quit the game.

### output_display.py
- Imports: None
- Exports: OutputDisplay class
- API:
  - `OutputDisplay.show_initial_cards()`: Display the initial cards dealt to the player and dealer.
  - `OutputDisplay.show_turn_result()`: Display the result of a player's or dealer's turn (hit or stand).
  - `OutputDisplay.show_round_result()`: Display the result of the round (win, lose, or draw) and the player's updated money.
  - `OutputDisplay.show_quit_message()`: Display a message when the player quits the game.
- Description: This module handles output display, showing the game state, turn results, round results, and quit message.

## Command Line Client
- The command line client will be the main.py file, which can be executed to start the game.
- Usage: `python main.py`
- The client will guide the user through the game, prompting them for input and displaying the game state.