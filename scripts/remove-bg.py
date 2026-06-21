"""
SCRIPTS DE PREPROCESADO DE IMÁGENES
=====================================
Propósito: quitar el fondo de los frames JPG originales, normalizar tamaño,
centrar el objeto y exportar PNG con transparencia.

Uso:
  1. Asegúrate de tener Python 3.8+ instalado
  2. pip install rembg pillow
  3. Coloca tus JPG originales en la carpeta ./raw_frames/
     (nombrados como quieras, el script los renombrará)
  4. python scripts/remove-bg.py
  5. Los PNG procesados se guardarán en ./public/frames/

Personalización (cambia estas constantes):
  - TARGET_SIZE: tamaño del canvas de salida (ancho, alto)
  - TOTAL_FRAMES: número total de frames a procesar
  - INPUT_DIR: carpeta de entrada con los JPG originales
  - OUTPUT_DIR: carpeta de salida para los PNG
"""

import os
import glob
from PIL import Image
import rembg

# ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
# Cambia esto si tus imágenes tienen otro tamaño deseado
TARGET_SIZE = (1600, 1600)
# Número total de frames (ajústalo si tienes más o menos)
TOTAL_FRAMES = 126
# Carpeta donde pusiste los JPG originales (creala si no existe)
INPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "raw_frames")
# Carpeta donde se guardarán los PNG finales
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "frames")
# ─── FIN CONFIGURACIÓN ───────────────────────────────────────────────────────


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Buscar todos los JPG en la carpeta de entrada (orden natural)
    jpgs = sorted(glob.glob(os.path.join(INPUT_DIR, "*.jpg")))
    if not jpgs:
        print(f"❌ No se encontraron JPG en: {INPUT_DIR}")
        print("   Coloca tus frames allí y vuelve a ejecutar.")
        return

    # Usar solamente los primeros TOTAL_FRAMES
    jpgs = jpgs[:TOTAL_FRAMES]

    print(f"✓ Se encontraron {len(jpgs)} JPG. Procesando...")

    for idx, jpg_path in enumerate(jpgs, start=1):
        output_name = f"frame_{idx:03d}.png"
        output_path = os.path.join(OUTPUT_DIR, output_name)

        if os.path.exists(output_path):
            print(f"  [{idx}/{TOTAL_FRAMES}] ⏭ Ya existe: {output_name}")
            continue

        print(f"  [{idx}/{TOTAL_FRAMES}] Procesando: {os.path.basename(jpg_path)} → {output_name}")

        # 1. Abrir imagen original
        with Image.open(jpg_path) as img:
            # 2. Quitar fondo con rembg
            img_no_bg = rembg.remove(img)

            # 3. Redimensionar manteniendo aspect ratio dentro del canvas
            img_no_bg.thumbnail((TARGET_SIZE[0], TARGET_SIZE[1]), Image.LANCZOS)

            # 4. Crear canvas transparente del tamaño objetivo y centrar la imagen
            canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
            x_offset = (TARGET_SIZE[0] - img_no_bg.width) // 2
            y_offset = (TARGET_SIZE[1] - img_no_bg.height) // 2
            canvas.paste(img_no_bg, (x_offset, y_offset), img_no_bg)

            # 5. Guardar como PNG optimizado
            canvas.save(output_path, "PNG", optimize=True)

    print(f"\n✅ ¡Listo! {TOTAL_FRAMES} frames procesados en: {OUTPUT_DIR}")
    print("   Ahora puedes ejecutar 'npm run dev' para ver la landing.")


if __name__ == "__main__":
    main()
