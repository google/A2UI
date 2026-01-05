"""
Extract Draceana Varieties - Fixed version v3
Uses clustering to detect actual visual rows instead of fixed buckets
"""
import fitz
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/draceana_varieties"
DRACEANA_PAGE = 14


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


def extract_draceana():
    doc = fitz.open(PDF_PATH)
    page = doc[DRACEANA_PAGE]
    
    print(f"\n📄 Page {DRACEANA_PAGE + 1}: Draceana Varieties")
    print("=" * 60)
    
    # Step 1: Extract images with xref mapping
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
    
    # Cluster images into rows
    image_rows = cluster_by_row(images, threshold=80)
    
    print(f"   Found {len(images)} images in {len(image_rows)} rows:")
    for row_idx, row in enumerate(image_rows):
        row_y = sum(img['y'] for img in row) / len(row)
        print(f"   Row {row_idx + 1} (Y≈{row_y:.0f}): {len(row)} images")
        for img in row:
            print(f"      xref={img['xref']} at ({img['x']:.0f}, {img['y']:.0f})")
    
    # Flatten back (row by row, left to right)
    sorted_images = []
    for row in image_rows:
        sorted_images.extend(row)
    
    # Step 2: Extract text
    print("\n📝 Extracting text...")
    
    skip_patterns = [r'^Heartyculture', r'^Kanha', r'^Call', r'^Draceana varieties']
    
    text_items = []
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
                text_items.append({
                    'text': text,
                    'x': bbox[0],
                    'y': bbox[1],
                })
    
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
    
    # Cluster plants into rows too
    plant_rows = cluster_by_row(plants, threshold=80)
    
    print(f"   Found {len(plants)} plants in {len(plant_rows)} rows:")
    for row_idx, row in enumerate(plant_rows):
        row_y = sum(p['y'] for p in row) / len(row)
        print(f"   Row {row_idx + 1} (Y≈{row_y:.0f}): {[p['common_name'] for p in row]}")
    
    sorted_plants = []
    for row in plant_rows:
        sorted_plants.extend(row)
    
    # Step 3: Match 1:1
    print(f"\n🔗 Matching {len(sorted_images)} images to {len(sorted_plants)} plants...")
    
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    results = []
    for idx, plant in enumerate(sorted_plants):
        entry = {
            'id': idx + 1,
            'scientific_name': plant['scientific_name'],
            'common_name': plant['common_name'],
            'category': 'Draceana Varieties',
        }
        
        if idx < len(sorted_images):
            img = sorted_images[idx]
            filename = f"{get_safe_filename(plant['common_name'])}.{img['ext']}"
            
            with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
                f.write(img['bytes'])
            
            entry['image'] = f"/heartyculture_catalogue/draceana_varieties/{filename}"
            print(f"   {idx+1}. {plant['common_name']} ← xref={img['xref']}")
        
        results.append(entry)
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\n✅ Done! Saved {len(results)} plants")
    return results


if __name__ == "__main__":
    extract_draceana()
