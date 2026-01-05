"""
Debug: Check if image xrefs match their visual positions correctly
"""
import fitz
import os

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "debug_images"

os.makedirs(OUTPUT_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)
page = doc[14]  # Page 15

print("Extracting images with position info...")
print("=" * 60)

# Get all images and their positions
images = []
image_list = page.get_images(full=True)

for img_idx, img in enumerate(image_list):
    xref = img[0]
    
    try:
        # Get position(s) of this image on the page
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        
        rect = rects[0]
        
        # Extract image
        base_image = doc.extract_image(xref)
        if len(base_image["image"]) < 5000:
            continue
        
        # Save with position info in filename
        filename = f"img_{img_idx:02d}_x{int(rect.x0)}_y{int(rect.y0)}.{base_image['ext']}"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        with open(filepath, 'wb') as f:
            f.write(base_image["image"])
        
        print(f"xref={xref:4d} | pos=({rect.x0:5.0f}, {rect.y0:5.0f}) | size={rect.width:3.0f}x{rect.height:3.0f} | {filename}")
        
        images.append({
            'xref': xref,
            'x': rect.x0,
            'y': rect.y0,
            'filename': filename
        })
        
    except Exception as e:
        print(f"Error: {e}")

doc.close()

print(f"\nSaved {len(images)} images to {OUTPUT_DIR}/")
print("\nPlease check the images - the filename shows their detected position.")
print("Compare with the PDF to see if positions are correct.")
