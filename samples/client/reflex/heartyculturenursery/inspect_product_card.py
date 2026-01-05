import urllib.request
import sys

url = "https://www.heartyculturenursery.com/collections/all"
try:
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    # Find a product card container. Common class is 'grid-view-item' or 'product-card'
    # Let's look for the Amaranthus title and print surrounding HTML
    start_index = html.find("Amaranthus Pygmy Torch")
    if start_index != -1:
        # Print 1000 characters before and after
        print(html[start_index-1000:start_index+1000])
    else:
        print("Could not find 'Amaranthus Pygmy Torch' in HTML.")
            
except Exception as e:
    print(f"Error: {e}")
