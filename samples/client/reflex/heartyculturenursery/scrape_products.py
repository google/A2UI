"""
Scraper for heartyculturenursery.com products
Extracts product names, prices, and images
"""
import requests
from bs4 import BeautifulSoup
import json
import os
import time
from urllib.parse import urljoin

BASE_URL = "https://www.heartyculturenursery.com"
COLLECTION_URL = f"{BASE_URL}/collections/all"
OUTPUT_DIR = "assets/scraped_new"
PRODUCTS_JSON = "assets/products.json"

# Headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

def get_all_products():
    """Fetch all products from the collection page"""
    products = []
    page = 1
    
    while True:
        url = f"{COLLECTION_URL}?page={page}"
        print(f"Fetching page {page}: {url}")
        
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find product cards - adjust selectors based on actual HTML structure
        product_cards = soup.select('.product-card, .product-item, .grid__item, [class*="product"]')
        
        if not product_cards:
            # Try alternative selectors
            product_cards = soup.select('a[href*="/products/"]')
        
        if not product_cards:
            print(f"No products found on page {page}")
            break
        
        page_products = []
        
        for card in product_cards:
            try:
                # Get product link
                link = card.get('href') or card.select_one('a')
                if hasattr(link, 'get'):
                    link = link.get('href')
                
                if not link or '/products/' not in str(link):
                    continue
                
                product_url = urljoin(BASE_URL, link) if link else None
                
                # Get title
                title_elem = card.select_one('.product-card__title, .product__title, h3, h2, .title')
                title = title_elem.get_text(strip=True) if title_elem else None
                
                if not title:
                    # Try to get from link text
                    title = card.get_text(strip=True) if hasattr(card, 'get_text') else None
                
                # Get price
                price_elem = card.select_one('.product-card__price, .price, .money, [class*="price"]')
                price = price_elem.get_text(strip=True) if price_elem else "Rs. 99.00"
                
                # Get image
                img_elem = card.select_one('img')
                image_url = None
                if img_elem:
                    image_url = img_elem.get('src') or img_elem.get('data-src') or img_elem.get('data-srcset')
                    if image_url:
                        image_url = urljoin(BASE_URL, image_url.split()[0])
                
                if title:
                    page_products.append({
                        'title': title.replace('_Biocarve Seeds', '').replace('_Biocarve Seeeds', '').strip(),
                        'price': price,
                        'image_url': image_url,
                        'product_url': product_url
                    })
                    
            except Exception as e:
                print(f"Error parsing product: {e}")
                continue
        
        if not page_products:
            print(f"No new products found on page {page}, stopping.")
            break
        
        products.extend(page_products)
        print(f"Found {len(page_products)} products on page {page}")
        
        # Check for next page
        next_page = soup.select_one('a[rel="next"], .pagination__next, [class*="next"]')
        if not next_page:
            break
        
        page += 1
        time.sleep(1)  # Be respectful to the server
    
    # Remove duplicates based on title
    seen = set()
    unique_products = []
    for p in products:
        if p['title'] not in seen:
            seen.add(p['title'])
            unique_products.append(p)
    
    return unique_products


def download_image(url, filename):
    """Download an image from URL"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False


def main():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("Fetching products from heartyculturenursery.com...")
    products = get_all_products()
    
    print(f"\nTotal unique products found: {len(products)}")
    
    if not products:
        print("No products found! The website structure may have changed.")
        print("Trying alternative approach - scraping individual product pages...")
        return
    
    # Download images and prepare final product list
    final_products = []
    
    for i, product in enumerate(products, 1):
        print(f"\nProcessing {i}/{len(products)}: {product['title']}")
        
        image_filename = None
        if product['image_url']:
            # Create safe filename
            safe_name = "".join(c for c in product['title'] if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_name = safe_name.replace(' ', '_')[:50]
            ext = product['image_url'].split('.')[-1].split('?')[0][:4]
            if ext not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                ext = 'jpg'
            
            image_filename = f"{safe_name}.{ext}"
            image_path = os.path.join(OUTPUT_DIR, image_filename)
            
            if download_image(product['image_url'], image_path):
                print(f"  Downloaded: {image_filename}")
            else:
                image_filename = None
        
        final_products.append({
            'id': i,
            'title': product['title'],
            'price': product['price'],
            'image': f"/scraped_new/{image_filename}" if image_filename else "/scraped/placeholder.jpg"
        })
        
        time.sleep(0.5)  # Be respectful
    
    # Save to products.json
    with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_products, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Done! Saved {len(final_products)} products to {PRODUCTS_JSON}")
    print(f"   Images saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
