# AssemblyModule.jsx 完整代码逻辑

## 1. 组件功能
组装模块 (AssemblyModule) 用于展示 OP10 (尺寸检测)、OP20 (压装检测)、OP30 (角度检测) 的实时数据、趋势图表及 CPK 统计。

## 2. 布局结构
- **垂直排列**: OP10 (上), OP20 (中), OP30 (下)。
- **高度比例**: OP10 (`flex-[1.4]`), OP20 (`flex-[0.8]`), OP30 (`flex-[0.8]`)。

## 3. 关键配置

### 3.1 OP10 (尺寸检测)
- **指标**: 直径 (D1, D2, D3) 和 距离 (L1, L2, L3)。
- **图表 1 (直径)**:
  - Y轴范围: `min: 50.0`, `max: 50.3`, `interval: 0.1`。
  - **MarkLine**: 上限 50.3, 下限 50.05。
  - **Clip**: `true` (超出范围的数据点将被截断)。
- **图表 2 (距离)**: 双图表展示。

### 3.2 OP20 (压装检测)
- **指标**: 位移 (1,2,3) 和 压力 (1,2,3)。
- **图表**: 压力趋势。
- **Y轴范围**: `min: 0`, `max: 5`, `interval: 2.5`。

### 3.3 OP30 (角度检测)
- **指标**: 角度 (1,2,3)。
- **图表**: 角度趋势。
- **Y轴范围**: `min: 88`, `max: 92`, `interval: 1`。
- **MarkLine**: 上限 91.5, 下限 88.5。
- **Grid**: `right: 80` (为右侧标签留白)。

## 4. 完整代码备份

```jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Star, Square, CheckCircle } from 'lucide-react';

// ... (省略 MiniBarChart 定义)

const LineChart = ({ color, data, height = '100px', yAxisConfig, markLine, grid }) => {
    // ...
    const seriesList = data.map((seriesData, index) => ({
        // ...
        // Ensure data points outside axis range are clipped (not drawn)
        clip: true 
    }));
    // ...
};

const AssemblyModule = () => {
  // ... (状态定义与数据获取)

  return (
    <div className="flex flex-col h-full">
        {/* OP10 Section (flex-[1.4]) */}
        {/* OP20 Section (flex-[0.8]) */}
        {/* OP30 Section (flex-[0.8]) */}
    </div>
  );
};

export default AssemblyModule;
```
