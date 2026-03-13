
import os

file_path = r'c:\Users\Administrator\Desktop\Batz生产数据\src\components\AssemblyModule.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace font sizes (add 5px)
# text-sm (14px) -> 19px
content = content.replace('text-sm', 'text-[19px]')
# text-lg (18px) -> 23px
content = content.replace('text-lg', 'text-[23px]')
# text-2xl (24px) -> 29px
content = content.replace('text-2xl', 'text-[29px]')

# ECharts fontSize: 15 -> 20
content = content.replace('fontSize: 15', 'fontSize: 20')

# Inline style fontSize: '15px' -> '20px'
content = content.replace("fontSize: '15px'", "fontSize: '20px'")

# Adjust container size for the larger font (w-5 h-5 -> w-7 h-7)
content = content.replace('w-5 h-5', 'w-7 h-7')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully.')
