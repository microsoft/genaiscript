# Notes on bugs in the code

When I run python main.py, I get the following error:

PS C:\projects\coarch\packages\mywordle\src> python.exe .\main.py
Traceback (most recent call last):
  File "C:\projects\coarch\packages\mywordle\src\main.py", line 2, in <module>
    from wordle_game import WordleGame
  File "C:\projects\coarch\packages\mywordle\src\wordle_game.py", line 2, in <module>
    from word_dictionary import WordDictionary
  File "C:\projects\coarch\packages\mywordle\src\word_dictionary.py", line 3, in <module>
    class WordDictionary:
  File "C:\projects\coarch\packages\mywordle\src\word_dictionary.py", line 7, in WordDictionary
    def load_words(self) -> List[str]:
NameError: name 'List' is not defined. Did you mean: 'list'?
PS C:\projects\coarch\packages\mywordle\src> cat .\main.py