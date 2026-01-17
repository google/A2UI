"""Script to add navbar() call to all category pages."""
import os
import re

# List of category page files that need navbar call added
category_pages = [
    # ("filename", "function_name")
    ("draceana_varieties.py", "draceana_varieties"),
    ("cordyline_varieties.py", "cordyline_varieties"),
    ("philodendron_varieties.py", "philodendron_varieties"),
    ("water_lilies_lotus.py", "water_lilies_lotus"),
    ("aquatic_plants.py", "aquatic_plants"),
    ("heliconia_varieties.py", "heliconia_varieties"),
    ("plumeria_varieties.py", "plumeria_varieties"),
    ("climbers_creepers.py", "climbers_creepers"),
    ("fruit_varieties.py", "fruit_varieties"),
    ("ginger_varieties.py", "ginger_varieties"),
    ("calathea_varieties.py", "calathea_varieties"),
    ("ornamental_musa.py", "ornamental_musa"),
    ("palm_varieties.py", "palm_varieties"),
    ("herbal_medicinal.py", "herbal_medicinal"),
    ("sacred_trees.py", "sacred_trees"),
    ("tree_species.py", "tree_species"),
    ("coconut_varieties.py", "coconut_varieties"),
    ("mango_varieties.py", "mango_varieties"),
    ("banana_varieties.py", "banana_varieties"),
    ("commercial_timber.py", "commercial_timber"),
    ("plants.py", "plants_page"),
]

pages_dir = "heartyculturenursery/pages"

for page_file, func_name in category_pages:
    file_path = os.path.join(pages_dir, page_file)
    if not os.path.exists(file_path):
        print(f"Skipping {page_file} - not found")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if navbar() is already called
    if "navbar()," in content:
        print(f"Skipping {page_file} - navbar() already called")
        continue
    
    # Find pattern: return rx.box( and add navbar() after it
    # Pattern is: def func_name() -> rx.Component:\n    """..."""\n    return rx.box(
    
    old_pattern = 'return rx.box(\n        # Header section'
    new_pattern = 'return rx.box(\n        navbar(),\n        # Header section'
    
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {page_file} - added navbar() (pattern 1)")
        continue
    
    # Try alternate patterns
    old_pattern2 = 'return rx.box(\n        # Breadcrumb'
    new_pattern2 = 'return rx.box(\n        navbar(),\n        # Breadcrumb'
    
    if old_pattern2 in content:
        content = content.replace(old_pattern2, new_pattern2)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {page_file} - added navbar() (pattern 2)")
        continue
    
    # Try generic pattern - find return rx.box( in the main function
    old_pattern3 = 'return rx.box(\n        rx.box('
    new_pattern3 = 'return rx.box(\n        navbar(),\n        rx.box('
    
    if old_pattern3 in content:
        content = content.replace(old_pattern3, new_pattern3, 1)  # Only replace first occurrence
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {page_file} - added navbar() (pattern 3)")
        continue
    
    # Try for plants.py specifically
    old_pattern4 = 'return rx.box(\n        # Hero Section'
    new_pattern4 = 'return rx.box(\n        navbar(),\n        # Hero Section'
    
    if old_pattern4 in content:
        content = content.replace(old_pattern4, new_pattern4)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {page_file} - added navbar() (pattern 4)")
        continue
        
    print(f"Could not update {page_file} - no matching pattern found")

print("\nDone!")
