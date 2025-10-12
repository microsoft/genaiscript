.PHONY: test changeset-release typecheck compile package release help

help:
	@echo "Available targets:"
	@echo "  test              - Run all tests"
	@echo "  typecheck         - Run TypeScript type checking"
	@echo "  compile           - Compile the project"
	@echo "  package           - Package the VSCode extension"
	@echo "  changeset-release - Run release process (depends on test)"
	@echo "  release           - Alias for changeset-release"

test:
	@echo "Running tests..."
	yarn test:core
	yarn test:samples

typecheck:
	@echo "Running type check..."
	yarn typecheck

compile:
	@echo "Compiling project..."
	yarn compile

package:
	@echo "Packaging VSCode extension..."
	yarn package

changeset-release: test typecheck compile package
	@echo "Running release process..."
	yarn release:draft
	yarn patch-versions
	yarn compile
	yarn package
	yarn release:vsix
	yarn commit-versions

release: changeset-release
