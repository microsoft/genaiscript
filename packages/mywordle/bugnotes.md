# Notes on bugs in the code

The the logic that computes the unguessed letters is incorrect.
It should not include letters from the secret word, it should be initiated to the alphabet, and the letters in the words already guessed should be removed from it.

The user should only have 6 turns and then the game should end and the secret word should be revealed. 
The interface should show how many guesses are left at the beginning of each turn.