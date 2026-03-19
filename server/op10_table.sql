-- OP10 检测直径和距离工位 数据表结构
-- 基于 plc数据.json 自动生成

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'op10_table')
BEGIN
    CREATE TABLE [dbo].[op10_table] (
        [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [CreatedTime] DATETIME DEFAULT GETDATE(),
        
        -- 核心标识
        [Code] NVARCHAR(255) NULL, -- 产品编码（条码保存用）
        [ProductStatus] INT NULL, -- 加工总结果 1=OK 2=NG
        
        -- 生产数据 (Production Data)
        [Production_PhotoResult1] INT NULL, -- 生产拍照结果1
        [Production_PhotoResult2] INT NULL, -- 生产拍照结果2
        [Production_PhotoResult3] INT NULL, -- 生产拍照结果3
        
        [Production_Circle1_Diameter] REAL NULL, -- 生产圆1直径
        [Production_Circle2_Diameter] REAL NULL, -- 生产圆2直径
        [Production_Circle3_Diameter] REAL NULL, -- 生产圆3直径
        
        [Production_CenterDist1] REAL NULL, -- 生产圆心间距1
        [Production_CenterDist2] REAL NULL, -- 生产圆心间距2
        [Production_CenterDist3] REAL NULL, -- 生产圆心间距3
        
        -- OK 标定数据 (Calibration OK Data)
        [CalibOK_PhotoResult1] INT NULL,
        [CalibOK_PhotoResult2] INT NULL,
        [CalibOK_PhotoResult3] INT NULL,
        
        [CalibOK_Circle1_Diameter] REAL NULL,
        [CalibOK_Circle2_Diameter] REAL NULL,
        [CalibOK_Circle3_Diameter] REAL NULL,
        
        [CalibOK_CenterDist1] REAL NULL,
        [CalibOK_CenterDist2] REAL NULL,
        [CalibOK_CenterDist3] REAL NULL,
        
        -- NG 标定数据 (Calibration NG Data)
        [CalibNG_PhotoResult1] INT NULL,
        [CalibNG_PhotoResult2] INT NULL,
        [CalibNG_PhotoResult3] INT NULL,
        
        [CalibNG_Circle1_Diameter] REAL NULL,
        [CalibNG_Circle2_Diameter] REAL NULL,
        [CalibNG_Circle3_Diameter] REAL NULL,
        
        [CalibNG_CenterDist1] REAL NULL,
        [CalibNG_CenterDist2] REAL NULL,
        [CalibNG_CenterDist3] REAL NULL,
        
        -- 状态信号
        [IsShielded] BIT NULL -- 是否屏蔽检索
    );

    -- 创建索引以加速查询
    CREATE INDEX [IX_op10_table_Code] ON [dbo].[op10_table] ([Code]);
    CREATE INDEX [IX_op10_table_CreatedTime] ON [dbo].[op10_table] ([CreatedTime]);
END
