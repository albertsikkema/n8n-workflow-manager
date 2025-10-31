#!/bin/bash

# Package n8n Workflow Manager extension for distribution
# Creates a ZIP file excluding development files

set -e

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')

# Output filename
OUTPUT="n8n-workflow-manager-v${VERSION}.zip"

echo "📦 Packaging n8n Workflow Manager v${VERSION}..."

# Remove old package if exists
if [ -f "$OUTPUT" ]; then
    echo "   Removing old package: $OUTPUT"
    rm "$OUTPUT"
fi

# Create ZIP with only necessary files
echo "   Creating ZIP archive..."
zip -r "$OUTPUT" \
    manifest.json \
    background.js \
    content.js \
    popup.html \
    popup.js \
    options.html \
    options.js \
    n8nApi.js \
    githubApi.js \
    styles.css \
    icons/*.png \
    LICENSE \
    PRIVACY_POLICY.md \
    README.md \
    -x "*.DS_Store" \
    -x "__MACOSX/*"

# Show file size
FILE_SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')

echo ""
echo "✅ Package created successfully!"
echo "   File: $OUTPUT"
echo "   Size: $FILE_SIZE"
echo ""
echo "📋 Next steps:"
echo "   1. Test the extension by loading it in Chrome"
echo "   2. Create a new release on GitHub"
echo "   3. Upload $OUTPUT to the GitHub release"
echo "   4. Upload $OUTPUT to Chrome Web Store Dashboard"
echo "   5. Submit for review on Chrome Web Store"
echo ""
