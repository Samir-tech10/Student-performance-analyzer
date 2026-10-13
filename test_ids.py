import re

with open('index.html', encoding='utf-8') as f:
    html = f.read()

with open('app.js', encoding='utf-8') as f:
    js = f.read()

pattern = r"document\.getElementById\(['\"]([^'\"]+)['\"]\)"
ids = set(re.findall(pattern, js))

missing = []
for el_id in sorted(ids):
    if f'id="{el_id}"' not in html and f"id='{el_id}'" not in html:
        # Check dynamic IDs like input_mark_ or fg_subject_ or live_tag_
        if not any(el_id.startswith(p) for p in ['input_mark_', 'fg_subject_', 'live_tag_']):
            missing.append(el_id)

print(f"Total IDs checked: {len(ids)}")
print(f"Missing IDs: {missing}")
