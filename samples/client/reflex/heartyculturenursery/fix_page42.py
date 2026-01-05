"""
Re-extract page 42 and properly assign images to plant names
"""
import fitz  # PyMuPDF
from pathlib import Path
import shutil

# Paths
PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = Path(r"c:\Users\rampr\Desktop\Explore\reflex\heartyculturenursery\assets\heartyculture_catalogue\fruit_varieties")

def extract_and_assign():
    print("Opening PDF...")
    doc = fitz.open(PDF_PATH)
    
    # Page 42 is index 41
    page = doc[41]
    image_list = page.get_images(full=True)
    
    print(f"Page 42 has {len(image_list)} images")
    
    # Based on PDF visual inspection, the order is:
    # Row1: Pears, Rose Apple, Raspberry, Water Apple
    # Row2: Salak, [header], Tree Tomato, Papino Fruit, Santol Fruit  
    # Row3: Ber, Hog Plum Sweet, Hog Plum Sour, Grapes Blue
    # Row4: Cat Eye Fruit, Silver Berry, Guajilote Fruit, Wild Jackfruit
    
    # Looking at dimensions to identify the header image (1438x560 was the footer)
    plant_images = []
    
    for idx, img_info in enumerate(image_list):
        xref = img_info[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        width = base_image.get("width", 0)
        height = base_image.get("height", 0)
        
        # Skip small images and the wide header/footer
        if width < 50 or height < 50:
            print(f"  Skipping small: {width}x{height}")
            continue
        
        if width > 1000:  # This is the header/footer
            print(f"  Skipping header/footer: {width}x{height}")
            continue
            
        plant_images.append({
            "idx": idx + 1,
            "bytes": image_bytes,
            "ext": image_ext,
            "width": width,
            "height": height
        })
        print(f"  Image {idx + 1}: {width}x{height} - {len(image_bytes)} bytes")
    
    doc.close()
    
    print(f"\nTotal plant images: {len(plant_images)}")
    
    # The correct order of plants on page 42
    # First 5 images: Pears, Rose Apple, Raspberry, Water Apple, Salak (these are OK)
    # Then after the header: Tree Tomato, Papino Fruit, Santol Fruit, Ber, Hog Plum Sweet, 
    #                       Hog Plum Sour, Grapes Blue, Cat Eye Fruit, Silver Berry, 
    #                       Guajilote Fruit, Wild Jackfruit
    
    plant_names_page42 = [
        "pears",
        "rose_apple", 
        "raspberry",
        "water_apple",
        "salak",
        "tree_tomato",
        "papino_fruit",
        "santol_fruit",
        "ber",
        "hog_plum_sweet",
        "hog_plum_sour",
        "grapes_blue",
        "cat_eye_fruit",
        "silver_berry",
        "guajilote_fruit",
        "wild_jackfruit",
    ]
    
    print(f"\nExpected plants: {len(plant_names_page42)}")
    
    if len(plant_images) != len(plant_names_page42):
        print(f"⚠️ Mismatch! Got {len(plant_images)} images but expected {len(plant_names_page42)}")
    
    # Assign and save
    print("\nAssigning images to plant names...")
    for i, (img, name) in enumerate(zip(plant_images, plant_names_page42)):
        filename = f"{name}.png"
        filepath = OUTPUT_DIR / filename
        
        with open(filepath, "wb") as f:
            f.write(img["bytes"])
        
        print(f"  ✅ Image {img['idx']} ({img['width']}x{img['height']}) -> {filename}")
    
    print("\n✅ Done!")


if __name__ == "__main__":
    extract_and_assign()
