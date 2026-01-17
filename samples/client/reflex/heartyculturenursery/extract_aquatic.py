"""
Extract Aquatic Plants - Separate from Water Lilies & Lotus
Processes page 19 (0-indexed: 18) - Aquatic plants section
"""
import fitz
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/aquatic_plants"
AQUATIC_PAGE = 18  # 0-indexed (page 19)


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


def extract_aquatic():
    doc = fitz.open(PDF_PATH)
    page = doc[AQUATIC_PAGE]
    
    print("\nAquatic Plants Extraction")
    print("=" * 60)
    
    # Skip patterns - include category headers
    skip_patterns = [
        r'^Heartyculture', r'^Kanha', r'^Call', 
        r'^Water lilies', r'^Lotus$', r'^Auqatic plants$'
    ]
    
    # Aquatic plants are in Y range ~350-850 based on PDF analysis
    # Row 1 text at Y≈514, Row 2 text at Y≈697
    # Images are above the text
    aquatic_y_min = 350
    aquatic_y_max = 850
    
    # Extract images in Aquatic section only
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
        
        # Only include images in aquatic section
        if rect.y0 >= aquatic_y_min and rect.y0 <= aquatic_y_max:
            images.append({
                'xref': xref,
                'x': rect.x0,
                'y': rect.y0,
                'bytes': base_image["image"],
                'ext': base_image["ext"],
            })
    
    image_rows = cluster_by_row(images, threshold=80)
    sorted_images = []
    for row in image_rows:
        sorted_images.extend(row)
    
    print(f"Found {len(sorted_images)} images in Aquatic section")
    
    # Extract text in Aquatic section only
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
                # Only include text in aquatic section
                if bbox[1] >= aquatic_y_min and bbox[1] <= aquatic_y_max:
                    raw_text_items.append({
                        'text': text,
                        'x': bbox[0],
                        'x_end': bbox[2],
                        'y': bbox[1],
                    })
    
    raw_text_items.sort(key=lambda t: (round(t['y']), t['x']))
    
    # Merge split spans
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
    
    # Group into columns and pair
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
    
    # Pair texts
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
    
    plant_rows = cluster_by_row(plants, threshold=80)
    sorted_plants = []
    for row in plant_rows:
        sorted_plants.extend(row)
    
    print(f"Found {len(sorted_plants)} plants")
    
    # Save
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    results = []
    used_filenames = set()
    
    for idx, plant in enumerate(sorted_plants):
        entry = {
            'id': idx + 1,
            'scientific_name': plant['scientific_name'],
            'common_name': plant['common_name'],
            'category': 'Aquatic Plants',
        }
        
        if idx < len(sorted_images):
            img = sorted_images[idx]
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
            
            entry['image'] = f"/heartyculture_catalogue/aquatic_plants/{filename}"
            print(f"   {idx+1}. {plant['common_name']} ({plant['scientific_name']})")
        
        results.append(entry)
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\nDone! Saved {len(results)} plants to {OUTPUT_DIR}")
    return results


if __name__ == "__main__":
    extract_aquatic()
