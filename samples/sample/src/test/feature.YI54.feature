Feature: Fill up the buffer

  Scenario: Buffer is empty
    Given the buffer is empty
    When the user fills up the buffer
    Then the buffer should be full

  Scenario: Buffer is partially filled
    Given the buffer is partially filled
    When the user fills up the buffer
    Then the buffer should be full

  Scenario: Buffer is already full
    Given the buffer is full
    When the user tries to fill up the buffer
    Then the buffer should remain full and display an error message