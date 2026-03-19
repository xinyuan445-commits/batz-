-- OP20 压装工位 数据表结构
-- 基于 plc数据.json 自动生成

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'op20_table')
BEGIN
    CREATE TABLE [dbo].[op20_table] (
        [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [CreatedTime] DATETIME DEFAULT GETDATE(),
        
        -- 核心标识
        [Code] NVARCHAR(255) NULL, -- 产品编码
        [ProductStatus] INT NULL, -- 加工总结果 1=OK 2=NG
        
        -- 压装结果 (Press Results)
        [PressResult_Left] INT NULL, -- 左压装结果
        [PressResult_Right] INT NULL, -- 右压装结果
        [PressResult_Back] INT NULL, -- 后压装结果
        
        -- 压装过程数据 (Press Process Data)
        [PressPressure_Left] REAL NULL, -- 左压装压力
        [PressDisplacement_Left] REAL NULL, -- 左压装位移
        
        [PressPressure_Right] REAL NULL, -- 右压装压力
        [PressDisplacement_Right] REAL NULL, -- 右压装位移
        
        [PressPressure_Back] REAL NULL, -- 后压装压力
        [PressDisplacement_Back] REAL NULL, -- 后压装位移
        
        -- 状态信号
        [IsShielded] BIT NULL -- 是否屏蔽检索
    );

    -- 创建索引
    CREATE INDEX [IX_op20_table_Code] ON [dbo].[op20_table] ([Code]);
    CREATE INDEX [IX_op20_table_CreatedTime] ON [dbo].[op20_table] ([CreatedTime]);
END
