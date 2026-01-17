import json
import os
import random

# List of products based on observation
product_titles = [
    "African Marigold F2 Yellow_Biocarve Seeds",
    "African Marigold Mix_Biocarve Seeds",
    "Alocasia pola",
    "Amaranthus Love Lies Bleeding_Biocarve Seeds",
    "Amaranthus Pygmy Torch_Biocarve Seeds",
    "Amaranthus Red_Biocarve Seeds",
    "Balsam Tom Thumb Mix_Biocarve Seeds",
    "Capsicum Choice Mix_Biocarve Seeds",
    "Capsicum Orange_Biocarve Seeds",
    "Celosia Icecream Series _Biocarve Seeeds",
    "Celosia Plumosa Mix_Biocarve Seeds",
    "Coleus Rainbow Mix_Biocarve Seeds",
    "Cosmos Bright Light_Biocarve Seeds",
    "Curly Kale_Biocarve Seeds",
    "French Bonanza Mix _Biocarve Seeds",
    "Gazania Sunshine Hybrids Mix_Biocarve Seeds",
    "Gomphrena Choice Mix_Biocarve Seeds",
    "Gomphrena Strawberry Fields_Biocarve Seeds",
    "Zinnia Pulcino Dwarf Mixed_Biocarve Seeds"
]

# List of scraped images (filenames)
image_dir = "assets/scraped"
if os.path.exists(image_dir):
    images = [f for f in os.listdir(image_dir) if f.endswith(('.jpg', '.png', '.jpeg'))]
else:
    images = []

products = []
for i, title in enumerate(product_titles):
    # Clean title
    clean_title = title.replace("_Biocarve Seeds", "").replace("_Biocarve Seeeds", "")
    
    # Assign random image if available
    img_url = ""
    if images:
        img_url = f"/scraped/{images[i % len(images)]}"
        
    products.append({
        "title": clean_title,
        "price": "Rs. 99.00",
        "image": img_url
    })

output_file = "assets/products.json"
with open(output_file, "w") as f:
    json.dump(products, f, indent=2)

print(f"Generated {len(products)} products in {output_file}")
