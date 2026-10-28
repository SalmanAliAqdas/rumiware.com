"""Optional asset maintenance tool; Pillow is not required to build or host the site."""
from pathlib import Path
from PIL import Image,ImageOps
import json
root=Path(__file__).resolve().parent.parent
dest=root/'images/portraits';dest.mkdir(parents=True,exist_ok=True)
manifest={}
for name in ['salman','amir','hassan','hussain']:
 image=ImageOps.exif_transpose(Image.open(root/'images'/f'{name}.jpeg')).convert('RGB')
 image.thumbnail((256,256));target=dest/f'{name}.webp';image.save(target,format='WEBP',quality=86,method=6)
 manifest[name]={'width':image.width,'height':image.height,'bytes':target.stat().st_size}
(root/'src/data/portraits.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
capture=root/'reference/project-captures/mani-bakes-source.png'
if capture.exists():
 dest=root/'images/projects';dest.mkdir(parents=True,exist_ok=True)
 Image.open(capture).convert('RGB').save(dest/'mani-bakes.webp',format='WEBP',quality=84,method=6)
print(json.dumps(manifest,indent=2))
