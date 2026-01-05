import urllib.request
import re
import json
import html

url = "https://www.heartyculturenursery.com/collections/all"

try:
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        page_content = response.read().decode('utf-8')

    # Debug: Print the first occurrence of "grid-view-item"
    print("Searching for 'grid-view-item'...")
    if "grid-view-item" in page_content:
        print("Found 'grid-view-item'.")
        # Split and print first chunk
        chunks = page_content.split('class="grid-view-item')
        if len(chunks) > 1:
            print("First chunk after split:")
            print(chunks[1][:500]) # Print first 500 chars
    else:
        print("Did not find 'grid-view-item'.")
        
    # Debug: Print the first occurrence of "price-item"
    print("\nSearching for 'price-item'...")
    if "price-item" in page_content:
        print("Found 'price-item'.")
        match = re.search(r'<span[^>]*class="[^"]*price-item[^"]*"[^>]*>([^<]+)</span>', page_content)
        if match:
            print(f"Found price: {match.group(1)}")
        else:
            print("Could not extract price with regex.")
            # Print snippet around "price-item"
            idx = page_content.find("price-item")
            print(page_content[idx-100:idx+200])
            
except Exception as e:
    print(f"Error: {e}")
