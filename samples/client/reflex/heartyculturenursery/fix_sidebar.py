"""Script to fix sidebar text wrapping in all category pages."""
import os

# All category pages
pages = [
    "flowering_shrubs.py",
    "draceana_varieties.py", 
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
]

pages_dir = "heartyculturenursery/pages"

for page_file in pages:
    file_path = os.path.join(pages_dir, page_file)
    if not os.path.exists(file_path):
        print(f"Skipping {page_file} - not found")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Fix 1: Make sidebar wider (260px) to fit all text
    content = content.replace('width="220px"', 'width="260px"')
    content = content.replace('min_width="220px"', 'min_width="260px"')
    
    # Fix 2: Add white_space="nowrap" if not present - handle different code styles
    # Pattern 1: Multi-line text definition
    if 'white_space="nowrap"' not in content:
        # Look for rx.text(cat["name"], ... patterns and add white_space
        old_patterns = [
            'rx.text(cat["name"], font_size="0.9em", font_weight="600" if is_active else "400", color=',
            'rx.text(cat["name"], font_size="0.85em", font_weight="600" if is_active else "400", color=',
        ]
        for old in old_patterns:
            if old in content:
                # Find end of this rx.text and add white_space before closing paren
                idx = content.find(old)
                if idx != -1:
                    # Find the next closing paren after the color value
                    start = idx + len(old)
                    # Find pattern like: "#f472b6" if is_active else "#444")
                    rest = content[idx:]
                    # Find the closing paren of rx.text
                    paren_count = 0
                    end_idx = 0
                    for i, c in enumerate(rest):
                        if c == '(':
                            paren_count += 1
                        elif c == ')':
                            paren_count -= 1
                            if paren_count == 0:
                                end_idx = idx + i
                                break
                    if end_idx > 0:
                        # Insert white_space="nowrap" before the closing paren
                        content = content[:end_idx] + ', white_space="nowrap"' + content[end_idx:]
                        print(f"{page_file}: Added white_space=nowrap")
                        break
    
    # Fix 3: Reduce padding on items
    content = content.replace('padding="10px 12px"', 'padding="6px 8px"')
    content = content.replace('padding="8px 10px"', 'padding="6px 8px"')
    content = content.replace('padding="12px 14px"', 'padding="6px 8px"')
    
    # Fix 4: Reduce font size if too large
    content = content.replace('font_size="0.9em"', 'font_size="0.8em"')
    content = content.replace('font_size="1em"', 'font_size="0.85em"')
    
    # Fix 5: Change spacing from 1 to 0 in category list
    content = content.replace('spacing="1", align_items="stretch"', 'spacing="0", align_items="stretch"')
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"{page_file}: Updated")

print("\nDone!")
