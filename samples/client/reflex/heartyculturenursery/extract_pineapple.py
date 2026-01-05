"""
Extract Pineapple Varieties - No text labels, save all images
Processes page 45 (0-indexed: 44) - Pineapple section
"""
import fitz
import json
import os
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_DIR = "assets/heartyculture_catalogue/pineapple_varieties"
PAGES = [44]
MIN_Y = 640


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


def extract_pineapple():
    doc = fitz.open(PDF_PATH)
    
    print("\nPineapple Varieties Extraction")
    print("=" * 60)
    
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    all_images = []
    
    for page_num in PAGES:
        page = doc[page_num]
        print(f"\nPage {page_num + 1}:")
        
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
                'page': page_num + 1,
            })
        
        image_rows = cluster_by_row(images, threshold=80)
        for row in image_rows:
            all_images.extend(row)
        
        print(f"   Found {len(images)} images")
    
    # Save all images with numbered names
    results = []
    for idx, img in enumerate(all_images):
        filename = f"pineapple_{idx+1:02d}.{img['ext']}"
        with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
            f.write(img['bytes'])
        
        results.append({
            'id': idx + 1,
            'scientific_name': 'Ananas comosus',
            'common_name': f'Pineapple Variety {idx+1}',
            'category': 'Pineapple Varieties',
            'page': img['page'],
            'image': f"/heartyculture_catalogue/pineapple_varieties/{filename}"
        })
        print(f"      {filename}")
    
    with open(os.path.join(OUTPUT_DIR, 'plants.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    doc.close()
    print(f"\nDone! Saved {len(results)} images to {OUTPUT_DIR}")
    return results


if __name__ == "__main__":
    extract_pineapple()
