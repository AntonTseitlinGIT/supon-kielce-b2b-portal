import glob
import re

html_files = glob.glob('*.html')

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace <nav class="topbar">...</nav>
    nav_pattern = re.compile(r'<nav class="topbar"[\s\S]*?</nav>', re.MULTILINE)
    content = nav_pattern.sub('<app-nav></app-nav>', content)
    
    # Replace <footer class="page-footer">...</footer>
    footer_pattern = re.compile(r'<footer class="page-footer"[\s\S]*?</footer>', re.MULTILINE)
    content = footer_pattern.sub('<app-footer></app-footer>', content)
    
    # Insert components.js before app.js if not already there
    if '<script src="components.js"></script>' not in content:
        content = content.replace('<script src="app.js"></script>', '<script src="components.js"></script>\n  <script src="app.js"></script>')
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Replaced in", len(html_files), "files")
