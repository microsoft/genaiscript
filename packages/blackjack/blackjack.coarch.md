# Blackjack Project Plan {#PA21}
Idea: Create a command line application that allows users to play blackjack with it. It should allow the user to place a bet, be dealt multiple hands, and finally quit. Implement the blackjack dealer by always standing on 17 and above and drawing on anything less. The program should handle how much money the player has and print out the actions of the dealer and how much money the player has after each round.

-   [SA-planning](./blackjack1.saplan.coarch.md)


## Instructions for Software Architect (SA) {#YC52}
- Design a modular architecture for the command line application
- Identify the main components such as user interface, game logic, and player/dealer management
- Define APIs for interaction between components
- Ensure the architecture supports the game rules and requirements mentioned in the idea

## Instructions for Software Developer (SDE) {#PZ84}
- Implement the code for each component based on the architecture and APIs provided by the SA
- Ensure the command line interface is user-friendly and intuitive
- Implement the game logic, including betting, dealing hands, and quitting
- Implement the dealer's behavior as specified in the idea
- Manage the player's money and display it after each round

## Instructions for Quality Assurance Engineer (QA) {#RM25}
- Write test cases to cover all possible scenarios and edge cases in the game
- Test the command line interface for usability and user experience
- Verify the game logic implementation, including the dealer's behavior and player's money management
- Ensure the application meets the requirements specified in the idea

