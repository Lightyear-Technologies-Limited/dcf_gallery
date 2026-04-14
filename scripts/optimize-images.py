"""
Optimize all artwork images:
- Convert to WebP
- Generate two sizes: 1200px (detail) and 400px (thumbnail)
- Preserve aspect ratio
- Skip CryptoPunks (keep them small and pixelated as PNG)
"""

import os
from pathlib import Path
from PIL import Image

ART_DIR = Path("public/art/all")
OPTIMIZED_DIR = Path("public/art/optimized")
THUMB_DIR = Path("public/art/thumbs")

OPTIMIZED_DIR.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

DETAIL_MAX = 1200
THUMB_MAX = 400
WEBP_QUALITY = 82

# CryptoPunks contract - keep as small PNG
PUNK_CONTRACT = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb"

count = 0
skipped = 0
errors = 0

for f in sorted(ART_DIR.glob("*.png")):
    name = f.stem  # e.g., "0xa7d8...-78000145"

    # Skip if already optimized
    opt_path = OPTIMIZED_DIR / f"{name}.webp"
    thumb_path = THUMB_DIR / f"{name}.webp"

    if opt_path.exists() and thumb_path.exists():
        skipped += 1
        continue

    try:
        img = Image.open(f)

        # Check if it's a CryptoPunk (24x24 pixel art) - keep as PNG, just copy
        is_punk = PUNK_CONTRACT in name.lower()

        if is_punk:
            # Just copy small - punks are tiny
            if not (OPTIMIZED_DIR / f"{name}.png").exists():
                img.save(OPTIMIZED_DIR / f"{name}.png")
            if not (THUMB_DIR / f"{name}.png").exists():
                img.save(THUMB_DIR / f"{name}.png")
        else:
            # Detail size
            if not opt_path.exists():
                ratio = min(DETAIL_MAX / img.width, DETAIL_MAX / img.height, 1.0)
                if ratio < 1.0:
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    resized = img.resize(new_size, Image.LANCZOS)
                else:
                    resized = img
                resized.save(opt_path, "WEBP", quality=WEBP_QUALITY)

            # Thumbnail
            if not thumb_path.exists():
                ratio = min(THUMB_MAX / img.width, THUMB_MAX / img.height, 1.0)
                if ratio < 1.0:
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    resized = img.resize(new_size, Image.LANCZOS)
                else:
                    resized = img
                resized.save(thumb_path, "WEBP", quality=WEBP_QUALITY)

        count += 1
        if count % 20 == 0:
            print(f"  Optimized {count}...")
    except Exception as e:
        errors += 1
        print(f"  Error: {f.name}: {e}")

# Also optimize the curated images in /art/*.png
CURATED_DIR = Path("public/art")
for f in sorted(CURATED_DIR.glob("*.png")):
    name = f.stem
    opt_path = OPTIMIZED_DIR / f"curated-{name}.webp"
    thumb_path = THUMB_DIR / f"curated-{name}.webp"

    if opt_path.exists() and thumb_path.exists():
        continue

    try:
        img = Image.open(f)

        is_punk = "punk" in name.lower() or "cryptopunk" in name.lower()

        if is_punk:
            if not (OPTIMIZED_DIR / f"curated-{name}.png").exists():
                img.save(OPTIMIZED_DIR / f"curated-{name}.png")
            if not (THUMB_DIR / f"curated-{name}.png").exists():
                img.save(THUMB_DIR / f"curated-{name}.png")
        else:
            if not opt_path.exists():
                ratio = min(DETAIL_MAX / img.width, DETAIL_MAX / img.height, 1.0)
                if ratio < 1.0:
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    resized = img.resize(new_size, Image.LANCZOS)
                else:
                    resized = img
                resized.save(opt_path, "WEBP", quality=WEBP_QUALITY)

            if not thumb_path.exists():
                ratio = min(THUMB_MAX / img.width, THUMB_MAX / img.height, 1.0)
                if ratio < 1.0:
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    resized = img.resize(new_size, Image.LANCZOS)
                else:
                    resized = img
                resized.save(thumb_path, "WEBP", quality=WEBP_QUALITY)

        count += 1
    except Exception as e:
        errors += 1

# Grifters
GRIFTER_DIR = Path("public/art/grifters")
if GRIFTER_DIR.exists():
    for f in sorted(GRIFTER_DIR.glob("*.png")):
        name = f.stem
        opt_path = OPTIMIZED_DIR / f"grifter-{name}.webp"
        thumb_path = THUMB_DIR / f"grifter-{name}.webp"
        if opt_path.exists() and thumb_path.exists():
            continue
        try:
            img = Image.open(f)
            ratio = min(DETAIL_MAX / img.width, DETAIL_MAX / img.height, 1.0)
            if ratio < 1.0:
                resized = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)
            else:
                resized = img
            resized.save(opt_path, "WEBP", quality=WEBP_QUALITY)

            ratio = min(THUMB_MAX / img.width, THUMB_MAX / img.height, 1.0)
            if ratio < 1.0:
                resized = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)
            else:
                resized = img
            resized.save(thumb_path, "WEBP", quality=WEBP_QUALITY)
            count += 1
        except Exception as e:
            errors += 1

print(f"\nDone. Optimized {count}, skipped {skipped}, errors {errors}")

# Report sizes
import subprocess
orig = subprocess.check_output(["du", "-sh", "public/art/all"]).decode().split()[0]
opt = subprocess.check_output(["du", "-sh", "public/art/optimized"]).decode().split()[0]
thumb = subprocess.check_output(["du", "-sh", "public/art/thumbs"]).decode().split()[0]
print(f"Original: {orig}")
print(f"Optimized (1200px): {opt}")
print(f"Thumbnails (400px): {thumb}")
