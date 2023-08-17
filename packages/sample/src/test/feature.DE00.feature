Feature: Parse arguments x, y, z #2

  Scenario: Read filename, size, and outputfilename from command line arguments
    Given the command line arguments "filename.txt 100 output.txt"
    When the arguments are parsed
    Then the filename should be "filename.txt"
    And the size should be 100
    And the outputfilename should be "output.txt"

  Scenario: Read filename and size from command line arguments, outputfilename is optional
    Given the command line arguments "filename.txt 100"
    When the arguments are parsed
    Then the filename should be "filename.txt"
    And the size should be 100
    And the outputfilename should be null

  Scenario: Read only filename from command line arguments, size is mandatory, outputfilename is optional
    Given the command line arguments "filename.txt"
    When the arguments are parsed
    Then an error should be displayed for missing size

  Scenario: Missing mandatory filename from command line arguments
    Given the command line arguments ""
    When the arguments are parsed
    Then an error should be displayed for missing filename