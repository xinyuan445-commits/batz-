
import os

files = [
    r'c:\Users\Administrator\Desktop\Batz生产数据\src\components\InjectionModule.jsx',
    r'c:\Users\Administrator\Desktop\Batz生产数据\src\components\QualityModule.jsx'
]

replacements = {
    # Shrink by 1px from the previous state
    'text-[23px]': 'text-[22px]',
    'text-[25px]': 'text-[24px]',
    'text-[29px]': 'text-[28px]',
    'text-[35px]': 'text-[34px]',
    'text-[41px]': 'text-[40px]',
    
    # ECharts
    'fontSize: 28': 'fontSize: 27',
    'fontSize: 24': 'fontSize: 23',
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
