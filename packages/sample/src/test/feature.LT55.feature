Feature: Save Image

  Scenario: Initialize File API
    Given the necessary file APIs for image saving
    When the File API is initialized
    Then the File API is set up and imported

  Scenario: Load Image
    Given an image to be saved
    When the image is loaded using appropriate image handling libraries
    Then the image is ready for saving

  Scenario: Create Output File
    Given a desired file format and name
    When a new output file is created
    Then the output file is ready for saving the image

  Scenario: Save Image to Output File
    Given a loaded image and an output file
    When the image data is written to the output file using file APIs
    Then the image is saved to the output file

  Scenario: Close Output File
    Given a saved image in the output file
    When the output file is closed
    Then the output file is properly saved and data corruption is avoided