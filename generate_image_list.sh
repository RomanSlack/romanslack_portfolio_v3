#!/bin/bash

# Generate a JSON file listing all images in the hobbies folder
IMAGE_DIR="images/hobbies/hobbies_portfolio"
OUTPUT_FILE="hobbies_images.json"

echo "[" > $OUTPUT_FILE

first=true
for file in $IMAGE_DIR/*; do
    if [[ -f "$file" ]]; then
        # Check if it's an image file
        if [[ $file =~ \.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)$ ]]; then
            if [ "$first" = true ]; then
                first=false
            else
                echo "," >> $OUTPUT_FILE
            fi
            filename=$(basename "$file")
            echo "  \"$IMAGE_DIR/$filename\"" >> $OUTPUT_FILE
        fi
    fi
done

echo "" >> $OUTPUT_FILE
echo "]" >> $OUTPUT_FILE

echo "Image list generated in $OUTPUT_FILE"
