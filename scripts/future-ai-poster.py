"""Optional exports from the retained original image; requires existing Pillow."""
from pathlib import Path
from PIL import Image, ImageOps

folder = Path(__file__).resolve().parent.parent / 'images/blog'
original = Image.open(folder / 'future-of-ai-original.png').convert('RGB')
# Fit the complete composition; pad rather than crop any person or device.
fitted = ImageOps.contain(original, (1200, 630), Image.Resampling.LANCZOS)
canvas = Image.new('RGB', (1200, 630), '#0B1E2D')
canvas.paste(fitted, ((1200 - fitted.width) // 2, (630 - fitted.height) // 2))
canvas.save(folder / 'future-of-ai-cover.webp', quality=86, method=6)
canvas.resize((640, 336), Image.Resampling.LANCZOS).save(folder / 'future-of-ai-cover-640.webp', quality=85, method=6)
canvas.save(folder / 'future-of-ai-social.png', optimize=True)
print('Exported 1200x630 cover/social poster and 640x336 thumbnail without cropping.')
