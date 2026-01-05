"""
Extract Flowering Shrubs - Using same clustering logic as extract_draceana.py
Processes pages 3-13 (0-indexed) which contain Flowering Shrubs category
"""
import fitz
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/flowering_shrubs"
# Flowering Shrubs pages 4-14 in PDF (0-indexed: 3-13)
FLOWERING_SHRUBS_PAGES = list(range(3, 14))


def get_safe_filename(name):
    safe = re.sub(r'[^\w\-\s]', '', name)
    safe = safe.replace(' ', '_').lower()
    return safe[:50] if safe else "unknown"


def cluster_by_row(items, y_key='y', threshold=60):
    """Group items into rows based on Y position clustering"""
    if not items:
        return []
    
    # Sort by Y
    sorted_items = sorted(items, key=lambda x: x[y_key])
    
    rows = []
    current_row = [sorted_items[0]]
    
    for item in sorted_items[1:]:
        # If Y is close to previous item, same row
        if item[y_key] - current_row[-1][y_key] < threshold:
            current_row.append(item)
        else:
            # New row
            rows.append(current_row)
            current_row = [item]
    
    rows.append(current_row)
    
    # Sort each row by X
    for row in rows:
        row.sort(key=lambda x: x['x'])
    
    return rows


def extract_page(doc, page_num, skip_patterns):
    """Extract images and plants from a single page"""
    page = doc[page_num]
    
    # Extract images with xref mapping
    images = []
    for img in page.get_images(full=True):
        xref = img[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        
        rect = rects[0]
        base_image = doc.extract_image(xref)
        
        # Skip small images (likely logos/watermarks)
        if len(base_image["image"]) < 5000:
            continue
        
        images.append({
            'xref': xref,
            'x': rect.x0,
            'y': rect.y0,
            'bytes': base_image["image"],
            'ext': base_image["ext"],
        })
    
    # Cluster images into rows
    image_rows = cluster_by_row(images, threshold=80)
    
    # Flatten back (row by row, left to right)
    sorted_images = []
    for row in image_rows:
        sorted_images.extend(row)
    
    # Extract text - first get raw text items per line
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
                    'x_end': bbox[2],  # Right edge of text
                    'y': bbox[1],
                })
    
    # Sort by Y then X to merge split spans
    raw_text_items.sort(key=lambda t: (round(t['y']), t['x']))
    
    # Merge consecutive spans on same line (within 3px Y and 15px X gap)
    text_items = []
    i = 0
    while i < len(raw_text_items):
        current = raw_text_items[i].copy()
        
        # Try to merge with next items on same line
        while i + 1 < len(raw_text_items):
            next_item = raw_text_items[i + 1]
            # Check if on same Y line (within 3px) and X is close (within 15px gap from end)
            y_diff = abs(next_item['y'] - current['y'])
            x_gap = next_item['x'] - current['x_end']
            
            if y_diff < 3 and x_gap < 5 and x_gap >= -2:
                # Merge: concatenate text (only for truly split spans like 'G' + 'olden')
                if x_gap > 1:
                    current['text'] = current['text'] + next_item['text']
                else:
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

    
    # Group texts into columns and pair
    columns = []
    for text in text_items:
        found = False
        for col in columns:
            if abs(col['x'] - text['x']) < 60:
                col['items'].append(text)
                found = True
                break
        if not found:
            columns.append({'x': text['x'], 'items': [text]})
    
    for col in columns:
        col['items'].sort(key=lambda t: t['y'])
    
    columns.sort(key=lambda c: c['x'])
    
    # Pair texts (scientific name + common name)
    plants = []
    for col in columns:
        items = col['items']
        i = 0
        while i < len(items) - 1:
            t1, t2 = items[i], items[i+1]
            if abs(t2['y'] - t1['y']) < 25:
                plants.append({
                    'scientific_name': t1['text'],
                    'common_name': t2['text'],
                    'x': col['x'],
                    'y': t1['y'],
                })
                i += 2
            else:
                i += 1
    
    # Cluster plants into rows too
    plant_rows = cluster_by_row(plants, threshold=80)
    
    sorted_plants = []
    for row in plant_rows:
        sorted_plants.extend(row)
    
    return sorted_images, sorted_plants


def extract_flowering_shrubs():
    doc = fitz.open(PDF_PATH)
    
    print(f"\n🌸 Flowering Shrubs Extraction")
    print("=" * 60)
    
    skip_patterns = [
        r'^Heartyculture',
        r'^Kanha',
        r'^Call',
        r'^Flowering Shrubs$',
        r'^Flowering shrubs$',
    ]
    
    # Create output directory first
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    results = []
    total_images = 0
    total_plants = 0
    used_filenames = set()
    
    for page_num in FLOWERING_SHRUBS_PAGES:
        print(f"\n📄 Page {page_num + 1}:")
        
        images, plants = extract_page(doc, page_num, skip_patterns)
        
        print(f"   Found {len(images)} images, {len(plants)} plants")
        
        # Debug: show what we found
        if plants:
            print("   Plants detected:")
            for i, p in enumerate(plants):
                print(f"      {i+1}. {p['common_name']} ({p['scientific_name']}) @ ({p['x']:.0f}, {p['y']:.0f})")
        
        if images:
            print("   Images detected:")
            for i, img in enumerate(images):
                print(f"      {i+1}. xref={img['xref']} @ ({img['x']:.0f}, {img['y']:.0f})")
        
        # Match images to plants WITHIN THIS PAGE
        print(f"   Matching {len(images)} images to {len(plants)} plants on this page...")
        
        for idx, plant in enumerate(plants):
            entry = {
                'id': len(results) + 1,
                'scientific_name': plant['scientific_name'],
                'common_name': plant['common_name'],
                'category': 'Flowering Shrubs',
                'page': page_num + 1,
            }
            
            if idx < len(images):
                img = images[idx]
                filename = f"{get_safe_filename(plant['common_name'])}.{img['ext']}"
                
                # Handle duplicate filenames
                if filename in used_filenames:
                    name_base = get_safe_filename(plant['common_name'])
                    counter = 1
                    while filename in used_filenames:
                        filename = f"{name_base}_{counter}.{img['ext']}"
                        counter += 1
                
                used_filenames.add(filename)
                filepath = os.path.join(OUTPUT_DIR, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(img['bytes'])
                
                entry['image'] = f"/heartyculture_catalogue/flowering_shrubs/{filename}"
                print(f"      ✓ {plant['common_name']} ← xref={img['xref']}")
            else:
                print(f"      ✗ {plant['common_name']} (no image)")
            
            results.append(entry)
        
        total_images += len(images)
        total_plants += len(plants)
    
    print(f"\n📊 Total: {total_images} images, {total_plants} plants")
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\n✅ Done! Saved {len(results)} plants to {OUTPUT_DIR}")
    return results


if __name__ == "__main__":
    extract_flowering_shrubs()
