
# Description Create a command line blackjack application 

-   [game.saplan.gpspec.md](game.saplan.gpspec.md)

-   Be sure to follow the suggestions for formatting output files
-   [game\blackjack\game.py](game\blackjack\game.py)
-   [game\blackjack\deck.py](game\blackjack\deck.py)
-   [game\blackjack\player.py](game\blackjack\player.py)
-   [game\blackjack\dealer.py](game\blackjack\dealer.py)
-   [game\blackjack\cli.py](game\blackjack\cli.py)

## Known issues
- The values of the ace and face cards should be printed as "ace, king, queen, jack" instead of "1, 13, 12, 11" and the suit printed.
- WHen printed, all the cards should include the suit of the card as well as the value.
- Show the players hand after the cards are dealt.
- Show the each new card the player draws.
- Show the dealers visible cards when they are dealt.
- Show the dealers cards and the player's cards at the end.
- The dealer wins when there is a tie.

- Fix this issue when the player hits:

Traceback (most recent call last):
  File "C:\projects\coarch\packages\blackjack\game\blackjack\cli.py", line 45, in <module>
    main()
  File "C:\projects\coarch\packages\blackjack\game\blackjack\cli.py", line 22, in main
    if g.player_turn():
  File "C:\projects\coarch\packages\blackjack\game\blackjack\game.py", line 26, in player_turn
    print(f"Player hand: {display_hand(self.player.hand)}")
NameError: name 'display_hand' is not defined
PS C:\projects\coarch\packages\blackjack\game\blackjack> 



## Idea

Create a command line application that allows users to play blackjack with it. It should allow the user to place a bet, be dealt multiple hands, and finally quit. Implement the blackjack dealer by always standing on 17 and above and drawing on anything less. The program should handle how much money the player has and print out the actions of the dealer and how much money the player has after each round.

## Tasks

### Software Architect (SA)

1. Design the software architecture for a command line blackjack application.
2. Identify the main components, their APIs, and how they will interact with each other.
3. Ensure the architecture supports placing bets, dealing hands, and quitting the game.
4. Implement the blackjack dealer logic, standing on 17 and above, and drawing on anything less.

### Software Developer (SDE)

1. Implement the command line interface for the blackjack application based on the architecture provided by the SA.
2. Develop the main components and their APIs as specified by the SA.
3. Ensure the application allows users to place bets, be dealt multiple hands, and quit the game.
4. Implement the dealer logic, standing on 17 and above, and drawing on anything less.

### Quality Assurance Engineer (QA)

1. Write test cases to ensure the command line blackjack application works correctly.
2. Test the application for placing bets, dealing hands, and quitting the game.
3. Verify the dealer logic, standing on 17 and above, and drawing on anything less.
4. Ensure the application handles the player's money and prints out the actions of the dealer and the player's money after each round.
