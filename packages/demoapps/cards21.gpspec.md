# Description create a command line application that plays the card game 21
-   [cards21.saplan.gpspec.md](cards21.saplan.gpspec.md)
-   [cards21.py](cards21.py)
-   [test_cards21.py](test_cards21.py)

## Idea

Create a command line application that allows users to play blackjack with it. It should allow the user to place a bet, be dealt multiple hands, and finally quit. Implement the blackjack dealer by always standing on 17 and above and drawing on anything less. The program should handle how much money the player has and print out the actions of the dealer and how much money the player has after each round.

## Additional Requirements

- When generating code, place all the code in a single file and call the file cards21.py
- When generating tests, place all the code in a single file and call the file test_cards21.py
- The values of the ace and face cards should be printed as "ace, king, queen, jack" instead of "1, 13, 12, 11"
- The suit of the card should be printed with the card value.
- Show the players hand after the cards are dealt.
- Show the the card when a new card is dealt to the player.
- Show the dealers visible cards when they are dealt.
- Show the dealers cards and the player's cards at the end.
- The dealer wins when there is a tie.



## Known Issues:

- UPDATE THE CODE to fix main to print out when the game starts how much money the player starts with.

## Tasks

### Software Architect (SA)

Design the software architecture for the command line application. Identify the APIs and how the different components will interact with each other. Ensure the architecture supports all the requirements stated in the Idea and Additional Requirements sections.

### Software Developer (SDE)

Implement the code for the command line application as per the architecture designed by the SA. Ensure the code meets all the requirements stated in the Idea and Additional Requirements sections. The code should be placed in a single file named cards21.py.

### Quality Assurance Engineer (QA)

Write test cases for the command line application. Ensure all the functionalities stated in the Idea and Additional Requirements sections are tested. Test cases should cover all possible scenarios including edge cases.
