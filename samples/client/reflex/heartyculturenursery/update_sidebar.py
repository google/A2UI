"""Script to update sidebar design in all category pages - handles different patterns."""
import os
import re

# Category pages that have sidebar
pages = [
    "cordyline_varieties.py",
    "philodendron_varieties.py",
    "water_lilies_lotus.py",
    "aquatic_plants.py",
    "heliconia_varieties.py",
    "plumeria_varieties.py",
    "climbers_creepers.py",
    "fruit_varieties.py",
    "ginger_varieties.py",
    "calathea_varieties.py",
    "ornamental_musa.py",
    "palm_varieties.py",
    "herbal_medicinal.py",
    "sacred_trees.py",
    "tree_species.py",
    "coconut_varieties.py",
    "mango_varieties.py",
    "banana_varieties.py",
    "commercial_timber.py",
    "draceana_varieties.py",
]

pages_dir = "heartyculturenursery/pages"

for page_file in pages:
    file_path = os.path.join(pages_dir, page_file)
    if not os.path.exists(file_path):
        print(f"Skipping {page_file} - not found")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    modified = False
    
    # Update 1: Add white_space="nowrap" to sidebar item text
    if 'white_space="nowrap"' not in content:
        # Pattern to find the text in sidebar_category_item
        pattern = r'(rx\.text\(\s*cat\["name"\],\s*font_size="[^"]+",\s*font_weight="[^"]+" if is_active else "[^"]+",\s*color="[^"]+" if is_active else "[^"]+")(,\s*\))'
        replacement = r'\1,\n                white_space="nowrap"\2'
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
            print(f"{page_file}: Added white_space=nowrap")
            modified = True
    
    # Update 2: Change spacing from "1" to "0" in category list vstack
    old_spacing = 'spacing="1",\n                align_items="stretch",\n                width="100%",'
    new_spacing = 'spacing="0",\n                align_items="stretch",\n                width="100%",'
    if old_spacing in content:
        content = content.replace(old_spacing, new_spacing)
        print(f"{page_file}: Changed spacing to 0")
        modified = True
    
    # Update 3: Reorder Category and Plants - move Category before Plants link
    # Pattern: Plants link first, then Category title
    old_order_pattern = r'(rx\.vstack\(\s*)(rx\.link\(\s*rx\.hstack\(\s*rx\.icon\("chevron-left"[^)]+\)[^)]+\)[^)]+\),\s*href="/plants"[^)]+\),\s*)(rx\.text\(\s*"Category"[^)]+\),)'
    new_order = r'\1\3\n            \2'
    
    if re.search(old_order_pattern, content):
        content = re.sub(old_order_pattern, new_order, content)
        print(f"{page_file}: Reordered Category above Plants")
        modified = True
    
    # Update 4: Change sidebar width from 260px to 220px
    content = content.replace('width="260px"', 'width="220px"')
    content = content.replace('min_width="260px"', 'min_width="220px"')
    content = content.replace('padding="1.5em"', 'padding="1em"')
    content = content.replace('top="0"', 'top="60px"')
    
    if modified:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        # Still save width changes
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"{page_file}: Applied width/padding updates")

print("\nDone!")
