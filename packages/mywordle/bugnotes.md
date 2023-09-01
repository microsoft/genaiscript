# Notes on bugs in the code

## Past issues
The file dictionary.txt contains all the 5-letter words that can be chosen.

The game should use the following symbols to show the user the results of their guess:
-   `*` for a letter that is in the hidden word but not in the correct position
-   the letter itself for a letter that is in the hidden word and in the correct position
-  `_` for a letter that is not in the hidden word

For example, if the hidden word is table, then the user's guess of `apple` should be displayed as `*__le`.
And the remaining letters should be shown as: `cdfghijkmnopqrsuvwxyz`.

The game should show the letters of the dictionary not used in any 
guesses after each guess.
## New issues

After each turn, the application should print the number of guesses remaining.

