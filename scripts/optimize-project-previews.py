"""Resize authentic captures without changing their interface or data. Requires Pillow only for regeneration."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parent.parent
ids=['stock-market','pdf-toolkit','weather','expense-tracker','qr-code-studio','movies']
manifest=[]
for project_id in ids:
    source=root/'reference/project-captures/streamlit'/f'{project_id}.png'
    image=Image.open(source).convert('RGB')
    if image.width*10!=image.height*16:
        raise ValueError(f'{project_id}: capture must already be 16:10; do not stretch it')
    record={'id':project_id,'original':str(source.relative_to(root)).replace('\\','/'),'originalWidth':image.width,'originalHeight':image.height,'originalBytes':source.stat().st_size,'outputs':[]}
    for width in [640,1280]:
        height=width*10//16
        filename=f'{project_id}-640.webp' if width==640 else f'{project_id}.webp'
        dest=root/'images/projects'/filename
        image.resize((width,height),Image.Resampling.LANCZOS).save(dest,format='WEBP',quality=86,method=6)
        record['outputs'].append({'file':'images/projects/'+filename,'width':width,'height':height,'bytes':dest.stat().st_size})
    manifest.append(record)
(root/'verification/portfolio-screenshots/assets.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(json.dumps(manifest,indent=2))
