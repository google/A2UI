"""
Extract Water Lilies & Lotus - Using clustering logic
Processes pages 18-19 (0-indexed: 17-18) which contain Water lilies & Lotus category
"""
import fitz
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/water_lilies_lotus"
PAGES = [17, 18]  # 0-indexed


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


def extract_page(doc, page_num):
    """Extract images and plants from a single page"""
    page = doc[page_num]
    
    # Skip patterns
    skip_patterns = [
        r'^Heartyculture', r'^Kanha', r'^Call', 
        r'^Water lilies', r'^Tropical Lilies$', r'^Tropical Night',
        r'^Hardy Lilies$', r'^Lotus$', r'^Auqatic plants$'
    ]
    
    # For page 19, only include Y < 400 (Lotus section, exclude Aquatic plants)
    # Aquatic plants are at Y > 450
    max_y = 400 if page_num == 18 else 999
    
    # Extract images
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
        
        # Filter by Y position for page 19
        if rect.y0 > max_y:
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
    sorted_images = []
    for row in image_rows:
        sorted_images.extend(row)
    
    # Extract text
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
                
                # Filter by Y position for page 19
                if bbox[1] > max_y:
                    continue
                
                raw_text_items.append({
                    'text': text,
                    'x': bbox[0],
                    'x_end': bbox[2],
                    'y': bbox[1],
                })
    
    # Sort by Y then X
    raw_text_items.sort(key=lambda t: (round(t['y']), t['x']))
    
    # Merge split spans (5px threshold)
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
    
    # Group into columns and pair (scientific + common name)
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
    
    # Cluster plants into rows
    plant_rows = cluster_by_row(plants, threshold=80)
    sorted_plants = []
    for row in plant_rows:
        sorted_plants.extend(row)
    
    return sorted_images, sorted_plants


def extract_water_lilies():
    doc = fitz.open(PDF_PATH)
    
    print("\nWater Lilies & Lotus Extraction")
    print("=" * 60)
    
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    all_results = []
    used_filenames = set()
    plant_id = 0
    
    for page_num in PAGES:
        print(f"\nPage {page_num + 1}:")
        
        images, plants = extract_page(doc, page_num)
        print(f"   Found {len(images)} images, {len(plants)} plants")
        
        # Match per page
        for idx, plant in enumerate(plants):
            plant_id += 1
            entry = {
                'id': plant_id,
                'scientific_name': plant['scientific_name'],
                'common_name': plant['common_name'],
                'category': 'Water Lilies & Lotus',
                'page': page_num + 1,
            }
            
            if idx < len(images):
                img = images[idx]
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
                
                entry['image'] = f"/heartyculture_catalogue/water_lilies_lotus/{filename}"
                print(f"      {idx+1}. {plant['common_name']} ({plant['scientific_name']})")
            
            all_results.append(entry)
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\nDone! Saved {len(all_results)} plants to {OUTPUT_DIR}")
    return all_results


if __name__ == "__main__":
    extract_water_lilies()
