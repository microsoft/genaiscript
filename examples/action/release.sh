
# make sure there's no other changes
git pull

# Lint and build
npm run lint
# Step 0: ensure we're in sync
if [ "$(git status --porcelain)" ]; then
  echo "❌ Pending changes detected. Commit or stash them first."
  exit 1
fi

# typecheck test
npm run typecheck

# Step 1: Bump patch version using npm
NEW_VERSION=$(npm version patch -m "chore: bump version to %s")
echo "version: $NEW_VERSION"

# Step 2: Push commit and tag
git push origin HEAD --tags

# Step 3: Create GitHub release
gh release create "$NEW_VERSION" --title "$NEW_VERSION" --notes "Patch release $NEW_VERSION"

# Step 4: update major tag if any
MAJOR=$(echo "$NEW_VERSION" | cut -d. -f1)
echo "major: $MAJOR"
git tag -f $MAJOR $NEW_VERSION
git push origin $MAJOR --force

echo "✅ GitHub release $NEW_VERSION created successfully."
