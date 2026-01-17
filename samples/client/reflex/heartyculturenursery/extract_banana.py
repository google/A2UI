"""
Extract Banana Plant Varieties - Single name format
Processes page 64 (0-indexed: 63)
"""
import fitz
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/banana_varieties"
PAGES = [63]  # 0-indexed (page 64)
MIN_Y = 320  # Start of Banana section


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
        r'^Banana Plant Varieties$'
    ]
    
    # Extract images
    images = []
    for img in page.get_images(full=True):
        xref = img[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        
        rect = rects[0]
        if rect.y0 < MIN_Y:
            continue
            
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
    
    # Extract text - single name per plant
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
                if bbox[1] < MIN_Y:
                    continue

                raw_texts.append({
                    'text': text,
                    'x': bbox[0],
                    'x_end': bbox[2],
                    'y': bbox[1],
                })
    
    raw_texts.sort(key=lambda t: (round(t['y']), t['x']))
    
    # Merge split spans (Horizontal)
    texts_horiz = []
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
        texts_horiz.append(current)
        i += 1

    # Merge multi-line names (Vertical) - Robust Look-ahead
    texts = []
    used_indices = set()
    
    for i in range(len(texts_horiz)):
        if i in used_indices:
            continue
            
        current = texts_horiz[i].copy()
        
        # Look ahead for a vertical match
        for j in range(i + 1, len(texts_horiz)):
            if j in used_indices:
                continue
                
            next_item = texts_horiz[j]
            y_diff = next_item['y'] - current['y']
            x_diff = abs(next_item['x'] - current['x'])
            
            # Stop looking if Y difference is too large (optimization)
            if y_diff > 50:
                break
                
            # Check if matching vertical line
            # print(f"Checking merge: '{current['text']}' + '{next_item['text']}' (Dy={y_diff:.1f}, Dx={x_diff:.1f})")
            if 5 <= y_diff <= 35 and x_diff < 60:
                current['text'] = current['text'] + " " + next_item['text']
                used_indices.add(j)
                # Continue looking for 3rd line? Usually max 2 lines.
                # Assuming max 2 lines for now or just allow it to append more? 
                # If we want to support 3 lines, we update 'current' Y? 
                # No, standard multi-line text usually keeps top Y. 
                # But y_diff is calculated from top. So 3rd line would be > 35 from top.
                # If we need 3 lines, we should update current['y'] to be next_item['y']? 
                # No, we want to anchor to top. 
                # For safety, let's stop after one merge to avoid greedy failures, or careful.
                # Bananas distinct lines are pairs.
                break 

        texts.append({
            'name': current['text'],
            'x': current['x'],
            'y': current['y'],
        })
    
    # Cluster names by row
    name_rows = cluster_by_row(texts, threshold=60)
    sorted_names = []
    for row in name_rows:
        sorted_names.extend(row)
    
    return sorted_images, sorted_names


def extract_banana():
    doc = fitz.open(PDF_PATH)
    
    print("\nBanana Plant Varieties Extraction")
    print("=" * 60)
    
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    all_results = []
    used_filenames = set()
    plant_id = 0
    
    for page_num in PAGES:
        print(f"\nPage {page_num + 1}:")
        
        images, names = extract_page(doc, page_num)
        print(f"   Found {len(images)} images, {len(names)} names")
        
        for idx, name in enumerate(names):
            plant_id += 1
            entry = {
                'id': plant_id,
                'scientific_name': 'Musa',
                'common_name': name['name'],
                'category': 'Banana Plant Varieties',
                'page': page_num + 1,
            }
            
            if idx < len(images):
                img = images[idx]
                filename = f"{get_safe_filename(name['name'])}.{img['ext']}"
                
                if filename in used_filenames:
                    counter = 1
                    base = get_safe_filename(name['name'])
                    while filename in used_filenames:
                        filename = f"{base}_{counter}.{img['ext']}"
                        counter += 1
                used_filenames.add(filename)
                
                with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
                    f.write(img['bytes'])
                
                entry['image'] = f"/heartyculture_catalogue/banana_varieties/{filename}"
                print(f"      {name['name']}")
            
            all_results.append(entry)
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\nDone! Saved {len(all_results)} plants to {OUTPUT_DIR}")
    return all_results


if __name__ == "__main__":
    extract_banana()
