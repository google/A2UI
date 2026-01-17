import json

try:
    with open('assets/products.json', 'r') as f:
        products = json.load(f)

    for i, product in enumerate(products):
        # Create a simple ID based on index or title
        product['id'] = i + 1
        # Ensure price is a string that can be parsed later if needed, but for now keep as is
        
    with open('assets/products.json', 'w') as f:
        json.dump(products, f, indent=2)
        
    print("Successfully added IDs to products.json")
except Exception as e:
    print(f"Error: {e}")
