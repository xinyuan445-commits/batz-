# Batz 生产数据看板部署指南

如果需要将本项目移动到其他电脑运行，请按照以下步骤操作：

## 1. 环境准备
确保目标电脑已安装：
- **Node.js**: 建议版本 v18 或更高。 [下载地址](https://nodejs.org/)
- **SQL Server**: 确保数据库服务已启动，并且包含 `BATZPlcData` 数据库。

## 2. 文件迁移
将整个项目文件夹复制到新电脑。
> **注意**: 为了节省传输时间，**不需要** 复制 `node_modules` 文件夹（根目录和 `server` 目录下都有）。这些可以在新电脑上重新安装。

## 3. 安装依赖
在新电脑上打开终端（CMD 或 PowerShell），进入项目根目录，执行以下命令：

1. **安装前端依赖**:
   ```bash
   npm install
   ```

2. **安装后端依赖**:
   ```bash
   cd server
   npm install
   cd ..
   ```
   *(注意：一定要先进入 server 目录安装后端依赖，然后再返回根目录)*

## 4. 数据库配置
打开 `server/.env` 文件，根据新电脑的数据库环境修改配置：

```ini
DB_USER=sa              # 数据库用户名
DB_PASSWORD=Ks123456    # 数据库密码
DB_SERVER=localhost     # 数据库地址 (如果是本机通常是 localhost 或 127.0.0.1)
DB_NAME=BATZPlcData     # 数据库名称
PORT=3001               # 后端端口 (通常保持默认)
```

## 5. 启动程序
在项目根目录执行：

```bash
npm run dev
```

该命令会自动同时启动：
- 后端 API 服务 (http://localhost:3001)
- 前端网页 (http://localhost:5566 或 5567)

启动成功后，浏览器会自动打开或手动访问显示的 Local 地址。

## 常见问题
- **启动报错 "Address already in use"**: 说明端口被占用，请关闭相关程序或在任务管理器中结束 node.js 进程。
- **数据库连接失败**: 请检查 `server/.env` 中的账号密码是否正确，以及 SQL Server 是否允许 TCP/IP 连接。
