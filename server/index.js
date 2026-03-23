const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { sql, poolPromise } = require('./db_config');
const adminRoutes = require('./admin_api'); // Import Admin API
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- Dashboard Config API ---
const configPath = path.join(__dirname, 'dashboard_config.json');

const defaultConfig = {
    production: { target: 1404, max: 1600 },
    yieldRate: { target: 98, max: 100 },
    oee: { target: 90, max: 100 }
};

app.get('/api/config/kpi', (req, res) => {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            // Default config if file doesn't exist
            res.json(defaultConfig);
        }
    } catch (err) {
        console.error('Error reading config:', err);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

app.get('/api/config/kpi/default', (req, res) => {
    res.json(defaultConfig);
});

app.post('/api/admin/config/kpi', (req, res) => {
    try {
        const newConfig = req.body;
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        res.json({ success: true, message: 'Configuration saved successfully' });
    } catch (err) {
        console.error('Error saving config:', err);
        res.status(500).json({ error: 'Failed to save config' });
    }
});
// -----------------------------

// Register Admin Routes
app.use('/api/admin', adminRoutes);

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Keep process alive
setInterval(() => {}, 1000);

app.get('/api/test-db', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT 1 as number');
        res.json({ 
            success: true, 
            message: 'Database connection successful', 
            data: result.recordset[0] 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed', 
            error: err.message 
        });
    }
});

app.get('/api/op10', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 15 
                CreatedTime,
                Code,
                ProductStatus,
                Production_PhotoResult1,
                Production_PhotoResult2,
                Production_PhotoResult3,
                Production_Circle1_Diameter,
                Production_Circle2_Diameter,
                Production_Circle3_Diameter,
                Production_CenterDist1,
                Production_CenterDist2,
                Production_CenterDist3,
                IsShielded
            FROM op10_table
            WHERE Code != 'TESLRBDXNM1'
              AND Code != 'P1673627-00-D:SCHC26075113845'
            ORDER BY CreatedTime DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching OP10 data:', err);
        res.status(500).json({ error: 'Failed to fetch OP10 data' });
    }
});

app.get('/api/op20', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 15 
                CreatedTime,
                Code,
                ProductStatus,
                PressResult_Left,
                PressResult_Right,
                PressResult_Back,
                PressPressure_Left,
                PressDisplacement_Left,
                PressPressure_Right,
                PressDisplacement_Right,
                PressPressure_Back,
                PressDisplacement_Back,
                IsShielded
            FROM op20_table
            ORDER BY CreatedTime DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching OP20 data:', err);
        res.status(500).json({ error: 'Failed to fetch OP20 data' });
    }
});

app.get('/api/op30', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 15 
                CreatedTime,
                Code,
                ProductStatus,
                Production_Angle_Vertical,
                Production_Angle_LeftParallel,
                Production_Angle_RightParallel,
                IsShielded
            FROM op30_table
            WHERE Code != 'TESLRBDXNM2'
              AND Code != 'P1673627-00-D:SCHC26075140601'
            ORDER BY CreatedTime DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching OP30 data:', err);
        res.status(500).json({ error: 'Failed to fetch OP30 data' });
    }
});

// Helper to get Beijing Time
const getBeijingDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 8));
};

// Calibration Check API for OP10
app.get('/api/op10/calibration-status', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Define shifts: Morning (08:00-20:00) and Night (20:00-08:00)
        // Use Beijing Time explicitly
        const now = getBeijingDate();
        const currentHour = now.getHours();
        
        let startTime, endTime;
        
        if (currentHour >= 8 && currentHour < 20) {
            // Morning shift: Today 08:00 to Today 20:00
            startTime = new Date(now);
            startTime.setHours(8, 0, 0, 0);
            endTime = new Date(now);
            endTime.setHours(20, 0, 0, 0);
        } else {
            // Night shift: Today 20:00 to Tomorrow 08:00 OR Yesterday 20:00 to Today 08:00
            if (currentHour >= 20) {
                startTime = new Date(now);
                startTime.setHours(20, 0, 0, 0);
                endTime = new Date(now);
                endTime.setDate(endTime.getDate() + 1);
                endTime.setHours(8, 0, 0, 0);
            } else {
                startTime = new Date(now);
                startTime.setDate(startTime.getDate() - 1);
                startTime.setHours(20, 0, 0, 0);
                endTime = new Date(now);
                endTime.setHours(8, 0, 0, 0);
            }
        }

        // Fix: Format dates as strings to avoid automatic UTC conversion by mssql driver
        // Because DB stores local time without timezone
        const formatDate = (date) => {
            return date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0') + ' ' +
                String(date.getHours()).padStart(2, '0') + ':' +
                String(date.getMinutes()).padStart(2, '0') + ':' +
                String(date.getSeconds()).padStart(2, '0');
        };

        const result = await pool.request()
            .input('startTime', sql.VarChar, formatDate(startTime))
            .input('endTime', sql.VarChar, formatDate(endTime))
            .query(`
                SELECT TOP 1 Code
                FROM op10_table
                WHERE Code = 'TESLRBDXNM1' 
                AND CreatedTime >= @startTime 
                AND CreatedTime < @endTime
            `);
            
        res.json({ isCalibrated: result.recordset.length > 0 });
    } catch (err) {
        console.error('Error checking OP10 calibration:', err);
        res.status(500).json({ error: 'Failed to check calibration status' });
    }
});

// Calibration Check API for OP30
app.get('/api/op30/calibration-status', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Define shifts: Morning (08:00-20:00) and Night (20:00-08:00)
        // Use Beijing Time explicitly
        const now = getBeijingDate();
        const currentHour = now.getHours();
        
        let startTime, endTime;
        
        if (currentHour >= 8 && currentHour < 20) {
            // Morning shift: Today 08:00 to Today 20:00
            startTime = new Date(now);
            startTime.setHours(8, 0, 0, 0);
            endTime = new Date(now);
            endTime.setHours(20, 0, 0, 0);
        } else {
            // Night shift: Today 20:00 to Tomorrow 08:00 OR Yesterday 20:00 to Today 08:00
            if (currentHour >= 20) {
                startTime = new Date(now);
                startTime.setHours(20, 0, 0, 0);
                endTime = new Date(now);
                endTime.setDate(endTime.getDate() + 1);
                endTime.setHours(8, 0, 0, 0);
            } else {
                startTime = new Date(now);
                startTime.setDate(startTime.getDate() - 1);
                startTime.setHours(20, 0, 0, 0);
                endTime = new Date(now);
                endTime.setHours(8, 0, 0, 0);
            }
        }

        // Fix: Format dates as strings to avoid automatic UTC conversion by mssql driver
        // Because DB stores local time without timezone
        const formatDate = (date) => {
            return date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0') + ' ' +
                String(date.getHours()).padStart(2, '0') + ':' +
                String(date.getMinutes()).padStart(2, '0') + ':' +
                String(date.getSeconds()).padStart(2, '0');
        };

        const result = await pool.request()
            .input('startTime', sql.VarChar, formatDate(startTime))
            .input('endTime', sql.VarChar, formatDate(endTime))
            .query(`
                SELECT TOP 1 Code
                FROM op30_table
                WHERE Code = 'TESLRBDXNM2' 
                AND CreatedTime >= @startTime 
                AND CreatedTime < @endTime
            `);
            
        res.json({ isCalibrated: result.recordset.length > 0 });
    } catch (err) {
        console.error('Error checking OP30 calibration:', err);
        res.status(500).json({ error: 'Failed to check calibration status' });
    }
});

// OP40 Data API - For Packaging Station Count
app.get('/api/op10/all', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                CreatedTime,
                Code,
                ProductStatus
            FROM op10_table
            WHERE Code != 'TESLRBDXNM1'
              AND Code != 'P1673627-00-D:SCHC26075113845'
              AND CreatedTime >= DATEADD(hour, -24, GETDATE())
            ORDER BY CreatedTime DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching OP10 all data:', err);
        res.status(500).json({ error: 'Failed to fetch OP10 all data' });
    }
});

app.get('/api/op20/all', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                CreatedTime,
                Code,
                ProductStatus
            FROM op20_table
            WHERE CreatedTime >= DATEADD(hour, -24, GETDATE())
            ORDER BY CreatedTime DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching OP20 all data:', err);
        res.status(500).json({ error: 'Failed to fetch OP20 all data' });
    }
});

app.get('/api/op30/all', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                CreatedTime,
                Code,
                ProductStatus
            FROM op30_table
            WHERE Code != 'TESLRBDXNM2'
              AND Code != 'P1673627-00-D:SCHC26075140601'
              AND CreatedTime >= DATEADD(hour, -24, GETDATE())
            ORDER BY CreatedTime DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching OP30 all data:', err);
        res.status(500).json({ error: 'Failed to fetch OP30 all data' });
    }
});

app.get('/api/op40', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                CreatedTime,
                Code,
                Station
            FROM op40_table
            WHERE CreatedTime >= DATEADD(hour, -24, GETDATE())
            ORDER BY CreatedTime ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching OP40 data:', err);
        // Return empty array instead of error to prevent frontend crash if table doesn't exist yet
        res.json([]);
    }
});

// Injection Module Data API
app.get('/api/injection', async (req, res) => {
    try {
        const pool = await poolPromise;
        // Fetch data for the last 24 hours to ensure charts have enough history
        // even just after midnight.
        const result = await pool.request().query(`
            SELECT 
                CreatedTime,
                GroupId,
                PartNumber,
                IsOk,
                IsPrinted
            FROM auto_line_table
            WHERE CreatedTime >= DATEADD(hour, -24, GETDATE())
            ORDER BY CreatedTime ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching injection data:', err);
        res.status(500).json({ error: 'Failed to fetch injection data' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
