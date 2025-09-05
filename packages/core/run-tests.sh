#!/bin/bash

# Test runner script for GenAIScript core package
# This script demonstrates how to run tests with minimal dependencies

set -e

echo "Setting up minimal test environment..."

# Create temporary directory for dependencies
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "Installing minimal test dependencies..."
npm init -y > /dev/null 2>&1
npm install tsx groq-js debug ms serialize-error type-fest inflection --no-fund --no-audit --silent

# Copy dependencies to core package
CORE_DIR="/home/runner/work/genaiscript/genaiscript/packages/core"
mkdir -p "$CORE_DIR/node_modules"
cp -r node_modules/* "$CORE_DIR/node_modules/"

echo "Running tests..."
cd "$CORE_DIR"

echo "✓ Testing simple functionality..."
node --import tsx --test src/simple.test.ts

echo "✓ Testing GROQ functionality..."
node --import tsx --test src/groq.test.ts

echo "✓ Testing inflection functionality..."
node --import tsx --test src/inflection.test.ts

echo "✓ All minimal tests passed!"

# Clean up
rm -rf "$TEMP_DIR"