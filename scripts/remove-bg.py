"""
remove-bg.py — Preprocesado batch con rembg (AI)
==================================================
Quita el fondo de las imágenes usando rembg (modelo u2net).
Mejor resultado para objetos blancos sobre fondo blanco.

USO:
  pip install rembg
  python scripts/remove-bg.py raw_frames/ public/frames/
"""

import sys, os
from pathlib import Path
from rembg import remove
from PIL import Image

src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('raw_frames')
dst = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('public/frames')
dst.mkdir(parents=True, exist_ok=True)

files = sorted([f for f in src.iterdir() if f.suffix.lower() in ('.jpg','.jpeg')])
total = len(files)
pad = len(str(total))

for i, f in enumerate(files):
    out = dst / f'frame_{str(i+1).zfill(pad)}.png'
    img = Image.open(f).convert('RGB')
    # redimensionar para mantener consistencia
    img = img.resize((1600, 1600), Image.LANCZOS)
    out_img = remove(img)
    out_img.save(out, 'PNG')
    print(f'[{round((i+1)/total*100)}%] {out.name}')

print(f'\nListo. {total} frames en {dst}')
