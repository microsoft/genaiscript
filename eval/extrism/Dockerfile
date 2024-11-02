# Use the official Python image from the Docker Hub
FROM python:3.11

# Set the working directory in the container
WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git

# Clone the GitHub repository
RUN git clone https://github.com/exercism/python

# Install the required Python packages
RUN pip install -r requirements.txt
RUN pip install pytest