"""
Extract Philodendron Varieties - Using same clustering logic
Processes page 17 (0-indexed: 16) which contains Philodendron Varieties category
"""
import fitz
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/philodendron_varieties"
PHILODENDRON_PAGE = 16  # 0-indexed


def get_safe_filename(name):
    safe = re.sub(r'[^\w\-\s]', '', name)
    safe = safe.replace(' ', '_').lower()
    return safe[:50] if safe else "unknown"


def cluster_by_row(items, y_key='y', threshold=60):
    """Group items into rows based on Y position clustering"""
    if not items:
        return []
    
    sorted_items = sorted(items, key=lambda x: x[y_key])
    
    rows = []
    current_row = [sorted_items[0]]
    
    for item in sorted_items[1:]:
        if item[y_key] - current_row[-1][y_key] < threshold:
            current_row.append(item)
        else:
            rows.append(current_row)
            current_row = [item]
    
    rows.append(current_row)
    
    for row in rows:
        row.sort(key=lambda x: x['x'])
    
    return rows


def extract_philodendron():
    doc = fitz.open(PDF_PATH)
    page = doc[PHILODENDRON_PAGE]
    
    print(f"\n📄 Page {PHILODENDRON_PAGE + 1}: Philodendron Varieties")
    print("=" * 60)
    
    # Step 1: Extract images with position
    print("\n🖼️ Extracting images...")
    
    images = []
    for img in page.get_images(full=True):
        xref = img[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        
        rect = rects[0]
        base_image = doc.extract_image(xref)
        
        if len(base_image["image"]) < 5000:
            continue
        
        images.append({
            'xref': xref,
            'x': rect.x0,
            'y': rect.y0,
            'bytes': base_image["image"],
            'ext': base_image["ext"],
        })
    
    image_rows = cluster_by_row(images, threshold=80)
    
    print(f"   Found {len(images)} images in {len(image_rows)} rows:")
    for row_idx, row in enumerate(image_rows):
        row_y = sum(img['y'] for img in row) / len(row)
        print(f"   Row {row_idx + 1} (Y≈{row_y:.0f}): {len(row)} images")
        for img in row:
            print(f"      xref={img['xref']} at X={img['x']:.0f}, Y={img['y']:.0f}")
    
    sorted_images = []
    for row in image_rows:
        sorted_images.extend(row)
    
    # Step 2: Extract text with span merging
    print("\n📝 Extracting text...")
    
    skip_patterns = [r'^Heartyculture', r'^Kanha', r'^Call', r'^Philodendron varieties$', r'^Philodendron Varieties$']
    
    raw_text_items = []
    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                if not text:
                    continue
                
                skip = any(re.match(p, text, re.I) for p in skip_patterns)
                if skip:
                    continue
                
                bbox = span["bbox"]
                raw_text_items.append({
                    'text': text,
                    'x': bbox[0],
                    'x_end': bbox[2],
                    'y': bbox[1],
                })
    
    raw_text_items.sort(key=lambda t: (round(t['y']), t['x']))
    
    # Merge consecutive spans (5px threshold)
    text_items = []
    i = 0
    while i < len(raw_text_items):
        current = raw_text_items[i].copy()
        
        while i + 1 < len(raw_text_items):
            next_item = raw_text_items[i + 1]
            y_diff = abs(next_item['y'] - current['y'])
            x_gap = next_item['x'] - current['x_end']
            
            if y_diff < 3 and x_gap < 5 and x_gap >= -2:
                current['text'] = current['text'] + next_item['text']
                current['x_end'] = next_item['x_end']
                i += 1
            else:
                break
        
        text_items.append({
            'text': current['text'],
            'x': current['x'],
            'y': current['y'],
        })
        i += 1
    
    # For Philodendron, most entries are just the name without separate common name
    # But some have pairs (like Philodendron Selloum + Tree philodendron)
    # Strategy: Sort by position and check if next item is a common name (not starting with Philodendron)
    
    text_items.sort(key=lambda t: (t['y'], t['x']))
    
    plants = []
    used_indices = set()
    
    for i, item in enumerate(text_items):
        if i in used_indices:
            continue
        
        text = item['text']
        
        # Skip if this is just a common name that was already paired
        if not text.startswith('Philodendron') and not text[0].isupper():
            continue
        
        scientific_name = text
        common_name = text  # Default: use same as scientific
        
        # Look for a potential common name below (within 25px Y, similar X)
        for j in range(i + 1, len(text_items)):
            if j in used_indices:
                continue
            next_item = text_items[j]
            y_diff = next_item['y'] - item['y']
            x_diff = abs(next_item['x'] - item['x'])
            
            # If it's close below and not a Philodendron name, it's the common name
            if 5 < y_diff < 30 and x_diff < 40:
                if not next_item['text'].startswith('Philodendron'):
                    common_name = next_item['text']
                    used_indices.add(j)
                    break
            elif y_diff >= 30:
                break  # Too far, stop looking
        
        plants.append({
            'scientific_name': scientific_name,
            'common_name': common_name,
            'x': item['x'],
            'y': item['y'],
        })
        used_indices.add(i)
    
    # Remove duplicates caused by merged text (e.g., 'Philodendron burle marx Philodendron ceylon gold')
    # Split these into separate entries
    final_plants = []
    for plant in plants:
        sci_name = plant['scientific_name']
        # Check if multiple Philodendrons are merged
        if sci_name.count('Philodendron') > 1:
            # Split by 'Philodendron'
            parts = sci_name.split('Philodendron')
            for part in parts[1:]:  # Skip first empty part
                name = 'Philodendron' + part.strip()
                final_plants.append({
                    'scientific_name': name,
                    'common_name': name,
                    'x': plant['x'],
                    'y': plant['y'],
                })
        else:
            final_plants.append(plant)
    
    plants = final_plants
    
    # Cluster plants into rows
    plant_rows = cluster_by_row(plants, threshold=80)
    
    print(f"   Found {len(plants)} plants in {len(plant_rows)} rows:")
    for row_idx, row in enumerate(plant_rows):
        row_y = sum(p['y'] for p in row) / len(row)
        print(f"   Row {row_idx + 1} (Y≈{row_y:.0f}): {[p['common_name'] for p in row]}")
    
    sorted_plants = []
    for row in plant_rows:
        sorted_plants.extend(row)
    
    # Step 3: Match by position (closest X in same row area)
    print(f"\nMatching {len(sorted_images)} images to {len(sorted_plants)} plants by position...")
    
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    results = []
    used_filenames = set()
    used_images = set()
    
    for idx, plant in enumerate(sorted_plants):
        entry = {
            'id': idx + 1,
            'scientific_name': plant['scientific_name'],
            'common_name': plant['common_name'],
            'category': 'Philodendron Varieties',
        }
        
        # Find closest image by X position (image should be roughly above the plant text)
        # Plant text is below the image, so look for image with closest X
        best_match = None
        best_dist = float('inf')
        
        for i, img in enumerate(sorted_images):
            if i in used_images:
                continue
            # Calculate distance based on X position (primary) and rough Y alignment
            x_dist = abs(img['x'] - plant['x'])
            # Images are above text, so image Y should be less than plant Y
            if img['y'] < plant['y'] + 200:  # Reasonable vertical range
                if x_dist < best_dist:
                    best_dist = x_dist
                    best_match = i
        
        if best_match is not None:
            used_images.add(best_match)
            img = sorted_images[best_match]
            filename = f"{get_safe_filename(plant['common_name'])}.{img['ext']}"
            
            if filename in used_filenames:
                counter = 1
                base = get_safe_filename(plant['common_name'])
                while filename in used_filenames:
                    filename = f"{base}_{counter}.{img['ext']}"
                    counter += 1
            used_filenames.add(filename)
            
            with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
                f.write(img['bytes'])
            
            entry['image'] = f"/heartyculture_catalogue/philodendron_varieties/{filename}"
            print(f"   {idx+1}. {plant['common_name']} (X={plant['x']:.0f}) <- xref={img['xref']} (X={img['x']:.0f})")
        
        results.append(entry)
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\n✅ Done! Saved {len(results)} plants to {OUTPUT_DIR}")
    return results


if __name__ == "__main__":
    extract_philodendron()
