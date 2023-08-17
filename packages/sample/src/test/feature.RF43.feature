# id: RF43
Feature: Validate mandatory arguments 

  Scenario: Ensure filename and size are provided
    Given a user provides the arguments
    When the system checks for the presence of "filename" and "size"
    Then the system should validate that both "filename" and "size" are provided