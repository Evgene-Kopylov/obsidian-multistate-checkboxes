#!/bin/bash
set -e

VERSION="${VERSION:-$(node -p "require('./package.json').version")}"
REPO="${GITHUB_OWNER:-Evgene-Kopylov}/${GITHUB_REPO:-obsidian-multistate-checkboxes}"

echo "Releasing version ${VERSION} to github.com/${REPO}"

# Check if release already exists
if curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    "https://api.github.com/repos/${REPO}/releases/tags/${VERSION}" | grep -q "200"; then
    echo "Release ${VERSION} already exists, skipping."
    exit 0
fi

# Create release
curl -s -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${REPO}/releases" \
    -d "{
        \"tag_name\": \"${VERSION}\",
        \"name\": \"${VERSION}\",
        \"body\": \"Release ${VERSION}\",
        \"draft\": false,
        \"prerelease\": false
    }" > /tmp/release.json

UPLOAD_URL=$(cat /tmp/release.json | grep '"upload_url"' | head -1 | sed 's/.*"upload_url": "\([^"]*\)".*/\1/' | sed 's/{?name,label}//')

if [ -z "$UPLOAD_URL" ]; then
    echo "Failed to create release"
    cat /tmp/release.json
    exit 1
fi

# Upload assets
for file in main.js manifest.json styles.css; do
    if [ -f "$file" ]; then
        echo "Uploading $file..."
        curl -s -X POST \
            -H "Authorization: token ${GITHUB_TOKEN}" \
            -H "Content-Type: application/octet-stream" \
            "${UPLOAD_URL}?name=${file}" \
            --data-binary "@${file}"
        echo ""
    fi
done

echo "Release ${VERSION} completed."
