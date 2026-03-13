# OP10 尺寸检测模块逻辑说明

## 1. 数据来源
- **数据库表**: `op10_table` (SQL Server)
- **API 接口**: `/api/op10` (GET)
- **获取方式**: 前端每 3 秒轮询一次后端接口。
- **查询逻辑**: 后端执行 SQL 查询 `SELECT TOP 20 ... FROM op10_table ORDER BY CreatedTime DESC`，获取最新的 20 条记录。

## 2. 字段映射
| 前端显示 | 数据库字段 | 说明 |
| :--- | :--- | :--- |
| **D1 (直径)** | `Production_Circle1_Diameter` | 生产圆1直径 |
| **D2 (直径)** | `Production_Circle2_Diameter` | 生产圆2直径 |
| **D3 (直径)** | `Production_Circle3_Diameter` | 生产圆3直径 |
| **L1 (距离)** | `Production_CenterDist1` | 生产圆心间距1 |
| **L2 (距离)** | `Production_CenterDist2` | 生产圆心间距2 |
| **L3 (距离)** | `Production_CenterDist3` | 生产圆心间距3 |
| **状态 (OK/NG)** | `ProductStatus` | 1=OK, 2=NG |
| **屏蔽状态** | `IsShielded` | 是否屏蔽检索 |

## 3. 界面展示逻辑
- **总体状态**: 
  - 取最新一条记录 (`latestOp10`)。
  - 如果 `ProductStatus === 1`，显示 **OK** (绿色主题)。
  - 否则显示 **NG** (红色主题)。
  - 如果 `IsShielded` 为真，额外显示 "(屏蔽)" 标签。

- **背景效果**: 
  - 绿色主题 (`bg-green-900/40`) 或 红色主题 (`bg-red-900/40`) 根据状态动态切换。
  - 包含动态扫描线动画效果。

- **数值展示**:
  - **上半部分**: 展示三个直径数据 (D1, D2, D3) 及其历史趋势图。
  - **下半部分**: 展示三个距离数据 (L1, L2, L3) 及其历史趋势图。
  - 所有数值保留 2 位小数。

- **趋势图表**:
  - 使用 `ReactECharts` 绘制折线图。
  - 数据源为最近 20 次的测量值 (从 API 获取数组后 `reverse` 以符合时间轴从左到右的习惯)。
  - 三条曲线分别对应三个测量点 (D1/L1, D2/L2, D3/L3)，颜色分别为 绿色、黄色、蓝色。

## 4. 异常处理
- 如果 API 请求失败或数据为空，界面数值显示为 `-`，状态默认为 NG (红色)。
