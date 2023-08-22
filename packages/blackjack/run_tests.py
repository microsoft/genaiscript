import unittest

# Import test modules
from test_main import TestMain
from test_game_logic import TestGameLogic
from test_user_input import TestUserInput
from test_output_display import TestOutputDisplay

# Create test suite
suite = unittest.TestSuite()
suite.addTest(unittest.makeSuite(TestMain))
suite.addTest(unittest.makeSuite(TestGameLogic))
suite.addTest(unittest.makeSuite(TestUserInput))
suite.addTest(unittest.makeSuite(TestOutputDisplay))

# Run tests
runner = unittest.TextTestRunner()
runner.run(suite)
