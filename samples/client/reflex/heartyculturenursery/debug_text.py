"""Debug page 64 text positions"""
import fitz

doc = fitz.open(r"C:\Users\rampr\Downloads\Heartyculture Nursery All Time Catalogue Call 9133320555 - WhatsApp 8688203607.pdf")
page = doc[63]

print("=== Page 64 text positions ===\n")
for block in page.get_text("dict")["blocks"]:
    if "lines" not in block:
        continue
    for line in block["lines"]:
        for span in line["spans"]:
            text = span["text"].strip()
            if not text or "Heartyculture" in text:
                continue
            bbox = span["bbox"]
            print(f"({bbox[0]:.0f}, {bbox[1]:.0f}) '{text}'")

doc.close()
