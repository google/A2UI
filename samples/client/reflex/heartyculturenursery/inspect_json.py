import urllib.request
import sys

url = "https://www.heartyculturenursery.com/collections/all"
try:
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    # Search for "untranslatedTitle"
    idx = html.find("untranslatedTitle")
    if idx != -1:
        # Print 500 chars before and after
        print(html[idx-500:idx+500])
    else:
        print("Could not find 'untranslatedTitle'.")
            
except Exception as e:
    print(f"Error: {e}")
