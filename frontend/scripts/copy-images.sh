#!/bin/bash
# change: add copy-images.sh — revert: git restore scripts/copy-images.sh
# Usage: ./scripts/copy-images.sh /path/to/images

# Check if source folder argument is provided
if [ $# -eq 0 ]; then
    echo "ERROR: Source folder path required"
    echo "Usage: $0 /path/to/images"
    exit 1
fi

SOURCE_FOLDER="$1"

# Validate source folder exists and is a directory
if [ ! -d "$SOURCE_FOLDER" ]; then
    echo "ERROR: Source folder does not exist or is not a directory: $SOURCE_FOLDER"
    exit 1
fi

# Get script directory and resolve destination path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DESTINATION="$REPO_ROOT/frontend/src/assets"

# Ensure destination exists
mkdir -p "$DESTINATION"

# Image file extensions to copy
EXTENSIONS=("*.png" "*.jpg" "*.jpeg" "*.webp" "*.svg")

# Copy files (handle spaces in filenames)
copied_count=0
copied_files=()

# Use find to get files matching extensions, handle spaces properly
while IFS= read -r -d '' file; do
    filename=$(basename "$file")
    dest_path="$DESTINATION/$filename"
    
    if cp -f "$file" "$dest_path" 2>/dev/null; then
        copied_files+=("$filename")
        echo "Copied: $filename"
        ((copied_count++))
    else
        echo "ERROR: Failed to copy $filename" >&2
    fi
done < <(find "$SOURCE_FOLDER" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.svg" \) -print0 2>/dev/null)

# Print summary
echo ""
echo "========================================"
echo "  Summary"
echo "========================================"
echo "Copied files:"
for filename in "${copied_files[@]}"; do
    echo "  - $filename"
done
echo ""
echo "Total files copied: $copied_count"
echo "Destination: $DESTINATION"
echo ""
echo "SUCCESS: Image copy completed!"

