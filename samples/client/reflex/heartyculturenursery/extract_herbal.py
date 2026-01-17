"""
Extract Herbal & Medicinal - Using proven clustering logic
Processes pages 49-51 (0-indexed: 48-50)
"""
import fitz
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/herbal_medicinal"
PAGES = [48, 49, 50]  # 0-indexed (pages 49-51)


def get_safe_filename(name):
    safe = re.sub(r'[^\w\-\s]', '', name)
    safe = safe.replace(' ', '_').lower()
    return safe[:50] if safe else "unknown"


def cluster_by_row(items, y_key='y', threshold=60):
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
    page = doc[page_num]
    
    skip_patterns = [
        r'^Heartyculture', r'^Kanha', r'^Call', 
        r'^Herbal', r'^Medicinal'
    ]
    
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
    
    # Extract text
    raw_texts = []
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
                raw_texts.append({
                    'text': text,
                    'x': bbox[0],
                    'x_end': bbox[2],
                    'y': bbox[1],
                })
    
    raw_texts.sort(key=lambda t: (round(t['y']), t['x']))
    
    # Merge split spans
    texts = []
    i = 0
    while i < len(raw_texts):
        current = raw_texts[i].copy()
        
        while i + 1 < len(raw_texts):
            next_item = raw_texts[i + 1]
            y_diff = abs(next_item['y'] - current['y'])
            x_gap = next_item['x'] - current['x_end']
            
            if y_diff < 3 and x_gap < 5 and x_gap >= -2:
                current['text'] = current['text'] + next_item['text']
                current['x_end'] = next_item['x_end']
                i += 1
            else:
                break
        
        texts.append({
            'text': current['text'],
            'x': current['x'],
            'y': current['y'],
        })
        i += 1
    
    # Group into columns
    columns = []
    for text in texts:
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
    
    # Pair texts (scientific + common name)
    plants = []
    for col in columns:
        items = col['items']
        i = 0
        while i < len(items) - 1:
            t1, t2 = items[i], items[i+1]
            y_diff = t2['y'] - t1['y']
            if 5 < y_diff < 30:
                plants.append({
                    'scientific_name': t1['text'],
                    'common_name': t2['text'],
                    'x': col['x'],
                    'y': t1['y'],
                })
                i += 2
            else:
                i += 1
    
    if plants:
        plant_rows = cluster_by_row(plants, threshold=80)
        sorted_plants = []
        for row in plant_rows:
            sorted_plants.extend(row)
    else:
        sorted_plants = []
    
    return sorted_images, sorted_plants


def extract_herbal():
    doc = fitz.open(PDF_PATH)
    
    print("\nHerbal & Medicinal Extraction")
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
        
        for idx, plant in enumerate(plants):
            plant_id += 1
            entry = {
                'id': plant_id,
                'scientific_name': plant['scientific_name'],
                'common_name': plant['common_name'],
                'category': 'Herbal & Medicinal',
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
                
                entry['image'] = f"/heartyculture_catalogue/herbal_medicinal/{filename}"
                print(f"      {plant['common_name']}")
            
            all_results.append(entry)
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\nDone! Saved {len(all_results)} plants to {OUTPUT_DIR}")
    return all_results


if __name__ == "__main__":
    extract_herbal()
