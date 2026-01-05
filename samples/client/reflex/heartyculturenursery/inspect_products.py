import urllib.request
import sys

url = "https://www.heartyculturenursery.com/collections/all"
try:
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    # Print a portion of HTML that likely contains product info
    # Searching for "Amaranthus" as a marker
    start_index = html.find("Amaranthus")
    if start_index != -1:
        # Print 2000 characters around the first match
        print(html[start_index-500:start_index+1500])
    else:
        print("Could not find 'Amaranthus' in HTML.")
            
except Exception as e:
    print(f"Error: {e}")
