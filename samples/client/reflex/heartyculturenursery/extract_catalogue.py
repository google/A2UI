"""
Extract plant data AND IMAGES from Heartyculture Nursery PDF Catalogue
- Detects categories from both top and bottom of pages
- Saves images with plant names (e.g., kesar.png)
- Handles Title Case scientific names (Aegle Marmelos)
- Handles cultivar-only entries (Plumeria varieties)
"""
import fitz  # PyMuPDF
import json
import os
import re
import shutil

PDF_PATH = r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf"
OUTPUT_BASE = "assets/heartyculture_catalogue"
OUTPUT_JSON = "assets/heartyculture_plants.json"

# Categories
CATEGORIES = [
    "Flowering shrubs", "Flowering Shrubs",
    "Draceana varieties", "Draceana Varieties",
    "Cordyline varieties", "Cordyline Varieties",
    "Philodendron varieties", "Philodendron Varieties",
    "Water lilies & Lotus", "Water Lilies & Lotus",
    "Aquatic plants", "Aquatic Plants",
    "Heliconia varieties", "Heliconia Varieties",
    "Plumeria varieties", "Plumeria Varieties",
    "Climbers & Creepers",
    "Fruit varieties", "Fruit Varieties",
    "Ginger varieties", "Ginger Varieties",
    "Calathea varieties", "Calathea Varieties",
    "Ornamental musa varieties", "Ornamental Musa Varieties",
    "Palm varieties", "Palm Varieties",
    "Herbal & Medicinal",
    "Sacred trees", "Sacred Trees",
    "Tree Species",
    "Coconut varieties", "Coconut Varieties",
    "Mango varieties", "Mango Varieties",
    "Banana varieties", "Banana Varieties", "Banana Plant Varieties",
    "Commercial timber plants", "Commercial Timber Plants",
]

# Categories where entries are just cultivar names (no scientific name)
CULTIVAR_ONLY_CATEGORIES = ["Plumeria Varieties"]

SKIP_PATTERNS = [
    r'^Heartyculture',
    r'^Kanha Shantivanam',
    r'^Call\s*:',
    r'^Mobile\s*:',
    r'^WhatsApp\s*:',
    r'^Hyderabad',
    r'^--- Page',
    r'^About Heartyculture',
    r'^Purpose:',
    r'^Highlights:',
    r'^Catagories$',
    r'^Categories$',
    r'^\d+$',
    r'^Email\s*:',
    r'^for farmers$',
]


def should_skip_line(line):
    for pattern in SKIP_PATTERNS:
        if re.match(pattern, line, re.IGNORECASE):
            return True
    return False


def normalize_category(cat):
    cat = cat.strip()
    mappings = {
        "flowering shrubs": "Flowering Shrubs",
        "draceana varieties": "Draceana Varieties",
        "cordyline varieties": "Cordyline Varieties",
        "philodendron varieties": "Philodendron Varieties",
        "water lilies & lotus": "Water Lilies & Lotus",
        "aquatic plants": "Aquatic Plants",
        "heliconia varieties": "Heliconia Varieties",
        "plumeria varieties": "Plumeria Varieties",
        "climbers & creepers": "Climbers & Creepers",
        "fruit varieties": "Fruit Varieties",
        "ginger varieties": "Ginger Varieties",
        "calathea varieties": "Calathea Varieties",
        "ornamental musa varieties": "Ornamental Musa Varieties",
        "palm varieties": "Palm Varieties",
        "herbal & medicinal": "Herbal & Medicinal",
        "sacred trees": "Sacred Trees",
        "tree species": "Tree Species",
        "coconut varieties": "Coconut Varieties",
        "mango varieties": "Mango Varieties",
        "banana varieties": "Banana Varieties",
        "banana plant varieties": "Banana Varieties",
        "commercial timber plants": "Commercial Timber Plants",
    }
    return mappings.get(cat.lower(), cat)


def is_category_line(line):
    line_clean = line.strip()
    for cat in CATEGORIES:
        if cat.lower() == line_clean.lower():
            return normalize_category(line_clean)
    return None


def is_scientific_name(line):
    """
    Check if line is a scientific name.
    Now accepts both:
    - lowercase species: "Mangifera indica"
    - Title Case species: "Aegle Marmelos", "Ficus Religiosa"
    """
    if not line or len(line) < 5 or len(line) > 80:
        return False
    
    line = line.strip()
    
    # Pattern 1: Genus species (lowercase species)
    # e.g., "Canna indica", "Mangifera indica"
    if re.match(r'^[A-Z][a-z]+\s+[a-z]+(\s+[a-z]+)?$', line):
        return True
    
    # Pattern 2: Genus Species (Title Case - common in Sacred Trees)
    # e.g., "Aegle Marmelos", "Ficus Religiosa", "Murraya Koenigii"
    if re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+$', line):
        # Make sure it's not a common name like "Bael Tree" or "Neem Tree"
        if not any(word in line for word in ['Tree', 'Plant', 'Palm', 'Flower', 'Bush', 'Vine', 'Lily']):
            return True
    
    # Pattern 3: Genus x species (hybrid)
    if re.match(r'^[A-Z][a-z]+\s+x\s+[a-z]+', line):
        return True
    
    # Pattern 4: Genus species with cultivar
    if re.match(r"^[A-Z][a-z]+\s+[a-z]+\s+'", line):
        return True
    if re.match(r"^[A-Z][a-z]+\s+x\s+'", line):
        return True
    
    # Pattern 5: Just genus with quoted cultivar
    if re.match(r"^[A-Z][a-z]+\s+'[^']+'$", line):
        return True
    
    # Pattern 6: Three-word scientific names with L suffix
    # e.g., "Syzygium Cumini L"
    if re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z]$', line):
        return True
    
    # Known genera patterns (lowercase or Title Case species)
    known_genera = [
        'Abution', 'Abutilon', 'Acacia', 'Acalypha', 'Adansonia', 'Aegle',
        'Aglaia', 'Albizzia', 'Allamanda', 'Alpinia', 'Alstonia', 'Andrographis',
        'Aquilaria', 'Areca', 'Artocarpus', 'Asclepias', 'Aster', 'Azadirachta',
        'Bambusa', 'Barleria', 'Barringtonia', 'Bauhinia', 'Bauhinea', 'Bixa',
        'Bombax', 'Brunfelsia', 'Buddleja', 'Butea', 'Caesalpinia', 'Calliandra',
        'Calophyllum', 'Calotropis', 'Cananga', 'Canna', 'Carissa', 'Caryota',
        'Cassia', 'Casuarina', 'Catharanthus', 'Ceiba', 'Celosia', 'Centratherum',
        'Cestrum', 'Chamaedorea', 'Chamaerops', 'Chorisia', 'Chrysalidocarpus',
        'Cinnamomum', 'Citrus', 'Clerodendrum', 'Clitoria', 'Cocos', 'Combretum',
        'Cordyline', 'Coryptha', 'Crossandra', 'Cuphea', 'Curcuma', 'Cycas',
        'Cyrtostachys', 'Dalbergia', 'Datura', 'Delonix', 'Dendrocalamus',
        'Dictyospermum', 'Dioon', 'Dombeya', 'Dracaena', 'Draceana', 'Duranta',
        'Dypsis', 'Elaeis', 'Eranthemum', 'Erthrina', 'Erythrina', 'Eucalyptus',
        'Euphorbia', 'Ficus', 'Garcinia', 'Gardenia', 'Gliricidia', 'Gmelina',
        'Gomphrena', 'Hamelia', 'Hedychium', 'Heliconia', 'Heterospathe',
        'Hibiscus', 'Holmskioldia', 'Howea', 'Hydrangea', 'Hymenocallis',
        'Hyophorbe', 'Impatiens', 'Ixora', 'Jacobinia', 'Jasminum', 'Jatropha',
        'Justicia', 'Kalanchoe', 'Karomia', 'Khaya', 'Kigelia', 'Koelreuteria',
        'Kopsia', 'Lagerstroemia', 'Lagerstromia', 'Lantana', 'Latania',
        'Lemonia', 'Leucophyllum', 'Licuala', 'Livistona', 'Loropetalum',
        'Madhuca', 'Malvaviscus', 'Mangifera', 'Medinilla', 'Megaskepasma',
        'Melastoma', 'Melia', 'Memecylon', 'Mimusops', 'Monocostus', 'Moringa',
        'Muntingia', 'Murraya', 'Musa', 'Mussaenda', 'Nematanthus', 'Neocarya',
        'Neodypsis', 'Neolamarckia', 'Neomarica', 'Nyctanthes', 'Nymphaea',
        'Ochna', 'Odontonema', 'Orthosiphon', 'Oscimum', 'Osmanthus',
        'Pachystachys', 'Parkia', 'Peltophorum', 'Philodendron', 'Phoenix',
        'Phyllanthus', 'Pithecellobium', 'Platanus', 'Plectranthus', 'Plumeria',
        'Podocarpus', 'Polianthes', 'Polyathia', 'Pongamia', 'Prosopis',
        'Pseudobombax', 'Pterocarpus', 'Pterospermum', 'Ptychosperma',
        'Putranjiva', 'Ravenala', 'Rhapis', 'Rondeletia', 'Roystonea', 'Ruellia',
        'Ruspolia', 'Ruttya', 'Sabal', 'Salvia', 'Samanea', 'Santalum', 'Saraca',
        'Saintpaulia', 'Schleichera', 'Simarouba', 'Spathodea', 'Stachytarpheta',
        'Sterculia', 'Stevia', 'Strelizia', 'Strelitzia', 'Suregada', 'Swietenia',
        'Syagrus', 'Syzygium', 'Tabebuia', 'Tabrbuia', 'Taespesia', 'Tamarindus',
        'Tecoma', 'Tectona', 'Termenale', 'Terminalia', 'Terminala', 'Thespesia',
        'Thevetia', 'Thuja', 'Tibouchina', 'Turnera', 'Veitchia', 'Verbena',
        'Wodyetia', 'Wrightia', 'Xanthostemon', 'Zamia',
    ]
    
    # Check if starts with known genus
    for genus in known_genera:
        # Case-insensitive genus match, then check for species word
        pattern = rf'^{genus}\s+\w+'
        if re.match(pattern, line, re.IGNORECASE):
            parts = line.split()
            if len(parts) >= 2:
                # It's a scientific name
                return True
    
    return False


def get_safe_filename(name):
    safe = re.sub(r'[^\w\-\s]', '', name)
    safe = safe.replace(' ', '_').lower()
    return safe[:50] if safe else "unknown"


def detect_page_category(page_text):
    lines = [l.strip() for l in page_text.split('\n') if l.strip()]
    
    for line in lines[:10]:
        cat = is_category_line(line)
        if cat:
            return cat
    
    for line in lines[-25:]:
        cat = is_category_line(line)
        if cat:
            return cat
    
    return None


def parse_plants_from_page(text, category):
    """Parse plants with proper handling for different category types"""
    plants = []
    lines = [l.strip() for l in text.split('\n')]
    
    # For cultivar-only categories (like Plumeria), each non-skip line is a variety name
    if category in CULTIVAR_ONLY_CATEGORIES:
        for line in lines:
            line = line.strip()
            if not line or should_skip_line(line) or is_category_line(line):
                continue
            if len(line) > 2 and len(line) < 60:
                plants.append({
                    'scientific_name': 'Plumeria',  # Generic genus
                    'common_name': line,
                })
        return plants
    
    # For normal categories with scientific name + common name pairs
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        if not line or should_skip_line(line) or is_category_line(line):
            i += 1
            continue
        
        # Check if this is a scientific name
        if is_scientific_name(line):
            scientific_name = line
            common_name = ""
            
            # Next line should be the common name
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line and not should_skip_line(next_line) and not is_scientific_name(next_line) and not is_category_line(next_line):
                    common_name = next_line
                    i += 1
            
            if scientific_name:
                plants.append({
                    'scientific_name': scientific_name,
                    'common_name': common_name if common_name else "Unknown",
                })
        
        i += 1
    
    return plants


def extract_data_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    page_data = []
    
    print("\n🖼️  Extracting images and data per page...")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        category = detect_page_category(text)
        if not category:
            continue
        
        # Extract images
        images = []
        image_list = page.get_images()
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                if len(image_bytes) < 5000:
                    continue
                
                images.append({
                    'bytes': image_bytes,
                    'ext': image_ext,
                })
            except:
                continue
        
        # Parse plants with category-aware logic
        plants = parse_plants_from_page(text, category)
        
        if images or plants:
            page_data.append({
                'page_num': page_num + 1,
                'category': category,
                'images': images,
                'plants': plants
            })
            
            if plants:
                print(f"   Page {page_num + 1}: {category} - {len(plants)} plants, {len(images)} images")
    
    doc.close()
    return page_data


def main():
    print("=" * 60)
    print("Heartyculture Nursery Catalogue Extractor v5")
    print("Handles Title Case scientific names + cultivar-only entries")
    print("=" * 60)
    
    if os.path.exists(OUTPUT_BASE):
        shutil.rmtree(OUTPUT_BASE)
    os.makedirs(OUTPUT_BASE, exist_ok=True)
    
    print(f"\n📄 Reading PDF: {os.path.basename(PDF_PATH)}")
    
    page_data = extract_data_from_pdf(PDF_PATH)
    
    # Group by category
    by_category = {}
    for pd in page_data:
        cat = pd['category']
        if cat not in by_category:
            by_category[cat] = {'plants': [], 'images': []}
        
        for idx, plant in enumerate(pd['plants']):
            plant['category'] = cat
            plant['page'] = pd['page_num']
            
            if idx < len(pd['images']):
                plant['_image_data'] = pd['images'][idx]
            
            by_category[cat]['plants'].append(plant)
    
    print("\n📂 Creating folder structure with named images...")
    
    all_plants = []
    total_images = 0
    
    for category, data in by_category.items():
        folder_name = get_safe_filename(category)
        folder_path = os.path.join(OUTPUT_BASE, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        
        used_names = set()
        
        for plant in data['plants']:
            if '_image_data' in plant:
                img_data = plant.pop('_image_data')
                
                base_name = plant.get('common_name', 'unknown')
                if base_name == "Unknown":
                    base_name = plant.get('scientific_name', 'unknown')
                safe_name = get_safe_filename(base_name)
                
                filename = f"{safe_name}.{img_data['ext']}"
                counter = 1
                while filename in used_names:
                    filename = f"{safe_name}_{counter}.{img_data['ext']}"
                    counter += 1
                used_names.add(filename)
                
                img_path = os.path.join(folder_path, filename)
                with open(img_path, 'wb') as f:
                    f.write(img_data['bytes'])
                
                plant['image'] = f"/heartyculture_catalogue/{folder_name}/{filename}"
                total_images += 1
            
            plant['id'] = len(all_plants) + 1
            all_plants.append(plant)
        
        # Save category JSON
        category_json = os.path.join(folder_path, "plants.json")
        with open(category_json, 'w', encoding='utf-8') as f:
            json.dump(data['plants'], f, indent=2, ensure_ascii=False)
        
        # Create README
        readme_path = os.path.join(folder_path, "README.md")
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(f"# {category}\n\n")
            f.write(f"Total plants: {len(data['plants'])}\n")
            f.write(f"Images: {len([p for p in data['plants'] if 'image' in p])}\n\n")
            f.write("| Scientific Name | Common Name |\n")
            f.write("|-----------------|-------------|\n")
            for p in data['plants']:
                f.write(f"| *{p['scientific_name']}* | {p['common_name']} |\n")
        
        img_count = len([p for p in data['plants'] if 'image' in p])
        print(f"  📁 {category}: {len(data['plants'])} plants, {img_count} images")
    
    # Save master JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(all_plants, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Done!")
    print(f"   Master JSON: {OUTPUT_JSON}")
    print(f"   Folders: {OUTPUT_BASE}/")
    print(f"   Total plants: {len(all_plants)}")
    print(f"   Total images: {total_images}")
    print(f"   Categories: {len(by_category)}")
    
    # Show samples
    print("\n📋 Sample entries from Sacred Trees:")
    for p in all_plants:
        if p['category'] == 'Sacred Trees':
            print(f"   {p['scientific_name']} → {p['common_name']}")
            break
    
    print("\n📋 Sample entries from Plumeria Varieties:")
    count = 0
    for p in all_plants:
        if p['category'] == 'Plumeria Varieties' and count < 3:
            print(f"   {p['scientific_name']} → {p['common_name']}")
            count += 1


if __name__ == "__main__":
    main()
