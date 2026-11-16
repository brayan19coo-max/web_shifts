from PIL import Image
import os, json, sys
OUT='/home/claude/web_shifts/assets/images/swaggy/3d/looks'
base='/tmp/sw/out/base'
box=None
for n in os.listdir(base):
    for f in os.listdir(f'{base}/{n}'):
        bb=Image.open(f'{base}/{n}/{f}').getchannel('A').point(lambda a:255 if a>10 else 0).getbbox()
        if bb: box=bb if box is None else (min(box[0],bb[0]),min(box[1],bb[1]),max(box[2],bb[2]),max(box[3],bb[3]))
box=(box[0]-6,box[1]-6,box[2]+6,box[3]+6)
H=box[3]-box[1]; W=round(240*H/260); extra=W-(box[2]-box[0]); box=(box[0]-extra//2,box[1],box[0]-extra//2+W,box[3]); TH=260; TW=240
print('box',box,TW,TH)
man=json.load(open('/home/claude/web_shifts/assets/images/swaggy/3d/manifest.json'))
for look in sys.argv[1:]:
    src=f'/tmp/sw/out/{look}'; os.makedirs(f'{OUT}/{look}',exist_ok=True); tot=0
    for n,cnt in man['anims'].items():
        fs=sorted(os.listdir(f'{src}/{n}'))[:cnt]
        sheet=Image.new('RGBA',(TW*len(fs),TH),(0,0,0,0))
        for i,f in enumerate(fs):
            sheet.paste(Image.open(f'{src}/{n}/{f}').convert('RGBA').crop(box).resize((TW,TH),Image.LANCZOS),(i*TW,0))
        p=f'{OUT}/{look}/{n}.webp'; sheet.save(p,'WEBP',quality=70,alpha_quality=80,method=6); tot+=os.path.getsize(p)
    print(look,tot//1024,'KB')
