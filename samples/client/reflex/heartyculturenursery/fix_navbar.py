"""Script to fix navbar placement in category pages."""
import os

# Pages that have category_sidebar function and need fixing
pages = [
    "water_lilies_lotus.py",
    "tree_species.py", 
    "sacred_trees.py",
    "plumeria_varieties.py",
    "philodendron_varieties.py",
    "palm_varieties.py",
    "ornamental_musa.py",
    "mango_varieties.py",
    "herbal_medicinal.py",
    "heliconia_varieties.py",
    "ginger_varieties.py",
    "fruit_varieties.py",
    "cordyline_varieties.py",
    "commercial_timber.py",
    "coconut_varieties.py",
    "climbers_creepers.py",
    "calathea_varieties.py",
    "banana_varieties.py",
    "aquatic_plants.py",
]

pages_dir = "heartyculturenursery/pages"

for page_file in pages:
    file_path = os.path.join(pages_dir, page_file)
    if not os.path.exists(file_path):
        print(f"Skipping {page_file} - not found")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Step 1: Remove navbar() from inside category_sidebar if present
    # Pattern: return rx.box(\n        navbar(),\n        rx.vstack(
    old_sidebar = 'return rx.box(\n        navbar(),\n        rx.vstack('
    new_sidebar = 'return rx.box(\n        rx.vstack('
    
    if old_sidebar in content:
        content = content.replace(old_sidebar, new_sidebar)
        print(f"{page_file}: Removed navbar() from category_sidebar")
    
    # Step 2: Find the main function and add navbar() after return rx.box(
    # The main function name is typically the filename without .py
    func_name = page_file.replace(".py", "").replace("_", " ").title().replace(" ", "_").lower()
    
    # Look for the return rx.box( in the main function that doesn't have navbar()
    # Pattern: def func_name() -> rx.Component:\n    """..."""\n    return rx.box(\n        # Header section
    
    # Check if navbar() already exists after return rx.box( in any function
    lines = content.split("\n")
    new_lines = []
    in_main_func = False
    navbar_added = False
    func_indent = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if we're entering a def function at module level (not indented much)
        if line.strip().startswith("def ") and " -> rx.Component:" in line and not line.startswith("    "):
            # This is a main function definition at module level
            current_indent = len(line) - len(line.lstrip())
            if current_indent > 0:
                # Nested function, skip
                pass
            else:
                # Check if this function already has navbar
                func_start = i
                # Look ahead to find return rx.box(
                for j in range(i, min(i+15, len(lines))):
                    if "return rx.box(" in lines[j]:
                        # Check next line for navbar
                        if j + 1 < len(lines) and "navbar()," in lines[j+1]:
                            navbar_added = True
                        break
        
        new_lines.append(line)
        i += 1
    
    # If navbar wasn't found, add it
    if not navbar_added:
        # Find pattern: return rx.box(\n        # Header section or similar
        patterns = [
            ('return rx.box(\n        # Header section', 'return rx.box(\n        navbar(),\n        # Header section'),
            ('return rx.box(\n        # Breadcrumb', 'return rx.box(\n        navbar(),\n        # Breadcrumb'),
            ('return rx.box(\n        rx.box(', 'return rx.box(\n        navbar(),\n        rx.box('),
        ]
        
        for old_pattern, new_pattern in patterns:
            if old_pattern in content and not 'navbar(),' in content.split(old_pattern)[1][:50]:
                # Count occurrences - only replace if it's in the main function area (after line 150)
                parts = content.split(old_pattern)
                if len(parts) > 1:
                    # Replace only the last occurrence (main function is usually at the end)
                    content = old_pattern.join(parts[:-1]) + new_pattern + parts[-1]
                    print(f"{page_file}: Added navbar() to main function")
                    navbar_added = True
                    break
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("\nDone!")
