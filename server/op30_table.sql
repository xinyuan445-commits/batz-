-- OP30 检测角度工位 数据表结构
-- 基于 plc数据.json 自动生成

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'op30_table')
BEGIN
    CREATE TABLE [dbo].[op30_table] (
        [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [CreatedTime] DATETIME DEFAULT GETDATE(),
        
        -- 核心标识
        [Code] NVARCHAR(255) NULL, -- 产品编码
        [ProductStatus] INT NULL, -- 加工总结果 1=OK 2=NG
        
        -- 生产数据 (Production Data)
        [Production_PhotoResult1] INT NULL,
        [Production_PhotoResult2] INT NULL,
        [Production_PhotoResult3] INT NULL,
        [Production_PhotoResult4] INT NULL,
        
        [Production_AngleResult_Vertical] INT NULL, -- 生产垂直角度结果
        [Production_AngleResult_LeftParallel] INT NULL, -- 生产左平行角度结果
        [Production_AngleResult_RightParallel] INT NULL, -- 生产右平行角度结果
        
        [Production_Angle_Vertical] REAL NULL, -- 生产垂直角度
        [Production_Angle_LeftParallel] REAL NULL, -- 生产左平行角度
        [Production_Angle_RightParallel] REAL NULL, -- 生产右平行角度
        
        -- OK 标定数据
        [CalibOK_PhotoResult1] INT NULL,
        [CalibOK_PhotoResult2] INT NULL,
        [CalibOK_PhotoResult3] INT NULL,
        [CalibOK_PhotoResult4] INT NULL,
        
        [CalibOK_AngleResult_Vertical] INT NULL,
        [CalibOK_AngleResult_LeftParallel] INT NULL,
        [CalibOK_AngleResult_RightParallel] INT NULL,
        
        [CalibOK_Angle_Vertical] REAL NULL,
        [CalibOK_Angle_LeftParallel] REAL NULL,
        [CalibOK_Angle_RightParallel] REAL NULL,
        
        -- NG 标定数据
        [CalibNG_PhotoResult1] INT NULL,
        [CalibNG_PhotoResult2] INT NULL,
        [CalibNG_PhotoResult3] INT NULL,
        [CalibNG_PhotoResult4] INT NULL,
        
        [CalibNG_AngleResult_Vertical] INT NULL,
        [CalibNG_AngleResult_LeftParallel] INT NULL,
        [CalibNG_AngleResult_RightParallel] INT NULL,
        
        [CalibNG_Angle_Vertical] REAL NULL,
        [CalibNG_Angle_LeftParallel] REAL NULL,
        [CalibNG_Angle_RightParallel] REAL NULL,
        
        -- 状态信号
        [IsShielded] BIT NULL -- 是否屏蔽检索
    );

    -- 创建索引
    CREATE INDEX [IX_op30_table_Code] ON [dbo].[op30_table] ([Code]);
    CREATE INDEX [IX_op30_table_CreatedTime] ON [dbo].[op30_table] ([CreatedTime]);
END
