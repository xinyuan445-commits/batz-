-- OP40 包装工位 数据表结构
-- 基于 plc数据.json 自动生成

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'op40_table')
BEGIN
    CREATE TABLE [dbo].[op40_table] (
        [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [Code] NVARCHAR(255) NULL, -- 包装台Code
        [Station] NVARCHAR(50) NULL, -- 工位名称
        [CreatedTime] DATETIME DEFAULT GETDATE() -- 创建时间
    );

    -- 创建索引
    CREATE INDEX [IX_op40_table_Code] ON [dbo].[op40_table] ([Code]);
    CREATE INDEX [IX_op40_table_CreatedTime] ON [dbo].[op40_table] ([CreatedTime]);
END
