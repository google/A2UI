import re
import os

def on_page_markdown(markdown, page, config, files):
    github_base_url = "https://github.com/google/A2UI/blob/main"
    
    def link_replacer(match):
        text = match.group(1)
        path = match.group(2)
        
        # Ignore external links
        if path.startswith(("http://", "https://", "mailto:", "tel:")):
            return match.group(0)
            
        # Count leading ../
        up_count = 0
        temp_path = path
        while temp_path.startswith("../"):
            up_count += 1
            temp_path = temp_path[3:]
            
        # Calculate file depth relative to docs dir
        # MkDocs src_path always uses '/'
        file_depth = len(page.file.src_path.split('/')) - 1
        
        # Check if the link points outside the docs folder
        # and isn't just linking to another Markdown file.
        if up_count > file_depth and not path.endswith(".md"):
            # To get to repo root from a file at file_depth, 
            # we need to go up file_depth + 1 levels.
            strip_count = file_depth + 1
            
            # Remove the leading '../' sequences that take us to the repo root
            clean_path = path[strip_count * 3:]
            
            # Return the newly formatted absolute GitHub link
            return f"[{text}]({github_base_url}/{clean_path})"
        
        # If it doesn't match our criteria, leave the link exactly as it is
        return match.group(0)

    # Find all standard markdown links: [text](path)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link_replacer, markdown)