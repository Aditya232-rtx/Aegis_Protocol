# Fix Unicode emojis in train_lstm.py
import re

with open('train_lstm.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all emoji unicode characters and variation selectors
content = re.sub(r'[\U0001F300-\U0001F9FF]', '[*]', content)
content = re.sub(r'[\u2600-\u26FF\u2700-\u27BF]', '[+]', content)
content = re.sub(r'[\ufe00-\ufe0f]', '', content)  # Variation selectors
content = content.replace('\u2705', '[+]')  # checkmark
content = content.replace('\U0001f4ca', '[*]')  # bar chart
content = content.replace('\U0001f4e6', '[*]')  # package
content = content.replace('\U0001f9e0', '[*]')  # brain
content = content.replace('\U0001f525', '[*]')  # fire
content = content.replace('\U0001f4cb', '[*]')  # clipboard
content = content.replace('\U0001f504', '[*]')  # arrows
content = content.replace('\U0001f4c8', '[*]')  # chart
content = content.replace('\U0001f4be', '[*]')  # disk
content = content.replace('\U0001f3af', '[*]')  # target
content = content.replace('\u2702', '[*]')  # scissors

with open('train_lstm.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed emoji encoding issues")
