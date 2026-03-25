const sql = require('mssql');
const path = require('path');
const fs = require('fs');

// Support both development and pkg executable environments for .env
// process.cwd() is the directory where the user double-clicks the .exe (e.g. Batz_Release)
// process.execPath is the path to the .exe itself. We'll check the folder of the .exe first.
const exeDir = path.dirname(process.execPath);
let envPath = path.resolve(exeDir, '.env');

if (!fs.existsSync(envPath)) {
    // Fallback to process.cwd()
    envPath = path.resolve(process.cwd(), '.env');
}
if (!fs.existsSync(envPath)) {
    // Fallback for development
    envPath = path.resolve(__dirname, '.env');
}

console.log(`[Config] Loading environment variables from: ${envPath}`);
const result = require('dotenv').config({ path: envPath });

if (result.error) {
    console.error('⚠️  Failed to load .env file. Database connection will likely fail if env vars are not set.');
}

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || '127.0.0.1', 
    database: process.env.DB_NAME || 'BatzPlcData',
    options: {
        encrypt: false, // 对于本地开发，通常设置为 false
        trustServerCertificate: true, // 信任自签名证书
        useUTC: false // 数据库时间作为本地时间处理，解决加8小时的问题
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};
