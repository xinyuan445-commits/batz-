
import os

files = [
    r'c:\Users\Administrator\Desktop\Batz生产数据\src\components\InjectionModule.jsx',
    r'c:\Users\Administrator\Desktop\Batz生产数据\src\components\QualityModule.jsx'
]

replacements = {
    # Tailwind classes
    'text-lg': 'text-[23px]',    # 18 -> 23
    'text-xl': 'text-[25px]',    # 20 -> 25
    'text-2xl': 'text-[29px]',   # 24 -> 29
    'text-3xl': 'text-[35px]',   # 30 -> 35
    'text-4xl': 'text-[41px]',   # 36 -> 41
    
    # ECharts/Inline styles
    'fontSize: 23': 'fontSize: 28',
    'fontSize: 19': 'fontSize: 24',
}

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes for {file_path}")
