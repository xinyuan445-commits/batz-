
import os

file_path = r'c:\Users\Administrator\Desktop\Batz生产数据\src\components\AssemblyModule.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Shrink font sizes by 2px (from previous +5px state to +3px state)
# text-[19px] -> text-[17px]
content = content.replace('text-[19px]', 'text-[17px]')
# text-[23px] -> text-[21px]
content = content.replace('text-[23px]', 'text-[21px]')
# text-[29px] -> text-[27px]
content = content.replace('text-[29px]', 'text-[27px]')

# ECharts fontSize: 20 -> 18
content = content.replace('fontSize: 20', 'fontSize: 18')

# Inline style fontSize: '20px' -> '18px'
content = content.replace("fontSize: '20px'", "fontSize: '18px'")

# Adjust container size (w-7 h-7 -> w-6 h-6)
content = content.replace('w-7 h-7', 'w-6 h-6')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully: Font sizes reduced by 2px.')
