Feature: Read command line arguments

  Scenario: Extract filename, size, and outputfilename from the command line arguments
    Given the command line arguments are provided
    When the system reads the command line arguments
    Then the system extracts the filename, size, and outputfilename