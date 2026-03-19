IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'auto_line_table')
BEGIN
    CREATE TABLE [dbo].[auto_line_table] (
        [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [CreatedTime] DATETIME DEFAULT GETDATE(),
        
        -- 业务字段
        [GroupId] NVARCHAR(50), -- 组号
        [PartNumber] NVARCHAR(50), -- 产品ID
        [IsOk] BIT DEFAULT 0, -- 是否OK产品
        [IsPrinted] BIT DEFAULT 0, -- 是否打印标签
        
        -- 注塑机过程数据 (时长单位: 秒)
        [tmCycleTime] REAL, -- 循环时间 (秒)
        [tmClpClsTime] REAL, -- 关模时间 (秒)
        [tmInjTime] REAL, -- 射出时间 (秒)
        [tmTurnTime] REAL, -- 转保压时间 (秒)
        [tmChargeTime] REAL, -- 储料时间 (秒)
        [tmClpOpnTime] REAL, -- 开模时间 (秒)
        [tmInjBackTime] REAL, -- 射退时间 (秒)
        [tmEjectTime] REAL, -- 托模时间 (秒)
        [tmFetchTime] REAL, -- 取件时间 (秒)
        
        -- 位置与压力
        [tmClpOpnPosi] REAL, -- 开模位置
        [tmInjStartPosi] REAL, -- 射出起点
        [tmInjEndPosi] REAL, -- 射出终点
        [tmTurnPosi] REAL, -- 转保压位置
        [tmTurnPress] REAL, -- 转保压压力
        [tmInjMaxPress] REAL, -- 射出尖压
        [tmChargeMaxPress] REAL, -- 储料尖压
        
        -- 温度
        [tmTemp1_Current] REAL, -- 实际温度 1
        [tmTemp2_Current] REAL, -- 实际温度 2
        [tmTemp3_Current] REAL, -- 实际温度 3
        [tmTemp4_Current] REAL, -- 实际温度 4
        [tmTemp5_Current] REAL, -- 实际温度 5
        [tmTemp6_Current] REAL, -- 实际温度 6
        [tmTemp7_Current] REAL, -- 实际温度 7
        [tmTemp8_Current] REAL, -- 实际温度 8
        [tmTemp9_Current] REAL, -- 实际温度 9
        
        [tmCoolingTime] REAL -- 模具冷却时间 (秒)
    );

    CREATE INDEX [IX_auto_line_table_GroupId] ON [dbo].[auto_line_table] ([GroupId]);
    CREATE INDEX [IX_auto_line_table_CreatedTime] ON [dbo].[auto_line_table] ([CreatedTime]);
END
