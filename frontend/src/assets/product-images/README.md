# Product Images Notes

This folder is now documentation-only.

## Canonical Runtime Location

Product images used by the app must be placed in:

- `frontend/public/product-images`

The app loads product data from `frontend/public/products.json` and resolves image paths such as `/product-images/<filename>` from the `public` directory at runtime.

## Image Files

Place your real image files in `frontend/public/product-images`. The filenames must match exactly the names in `frontend/public/products.json`.

### Current Image Files

The following 9 image files are expected in this directory:

1. `WhatsApp Image 2025-11-14 at 9.27.47 PM (4).jpeg`
2. `WhatsApp Image 2025-11-14 at 9.27.47 PM (3).jpeg`
3. `WhatsApp Image 2025-11-14 at 9.27.47 PM (2).jpeg`
4. `WhatsApp Image 2025-11-14 at 9.27.47 PM (1).jpeg`
5. `WhatsApp Image 2025-11-14 at 9.27.47 PM.jpeg`
6. `WhatsApp Image 2025-11-14 at 9.27.46 PM (3).jpeg`
7. `WhatsApp Image 2025-11-14 at 9.27.46 PM (2).jpeg`
8. `WhatsApp Image 2025-11-14 at 9.27.46 PM (1).jpeg`
9. `WhatsApp Image 2025-11-14 at 9.27.46 PM.jpeg`

## Image Specifications

- **Format**: JPG or PNG
- **Color Space**: sRGB
- **Recommended Dimensions**: 1200×900 pixels (4:3 aspect ratio)
- **File Size**: < 500 KB per image (recommended for web performance)

## Copying Images from Source Folder

To copy images from your source folder to this project directory, use the following PowerShell command:

```powershell
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.47 PM (4).jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.47 PM (4).jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.47 PM (3).jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.47 PM (3).jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.47 PM (2).jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.47 PM (2).jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.47 PM (1).jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.47 PM (1).jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.47 PM.jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.47 PM.jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.46 PM (3).jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.46 PM (3).jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.46 PM (2).jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.46 PM (2).jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.46 PM (1).jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.46 PM (1).jpeg" -Force
Copy-Item "C:\Users\sahil\Downloads\images\WhatsApp Image 2025-11-14 at 9.27.46 PM.jpeg" ".\frontend\public\product-images\WhatsApp Image 2025-11-14 at 9.27.46 PM.jpeg" -Force
```

Or use a loop to copy all images at once:

```powershell
$sourceDir = "C:\Users\sahil\Downloads\images"
$destDir = ".\frontend\public\product-images"

$files = @(
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (4).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (3).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (2).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM (1).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.47 PM.jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM (3).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM (2).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM (1).jpeg",
    "WhatsApp Image 2025-11-14 at 9.27.46 PM.jpeg"
)

foreach ($file in $files) {
    Copy-Item "$sourceDir\$file" "$destDir\$file" -Force
    Write-Host "Copied: $file"
}
```

## Notes

- Ensure filenames match exactly (including spaces and special characters)
- Product metadata is stored in `frontend/public/products.json`
- Image paths use this format: `/product-images/<FILENAME>`

