const express = require('express');
const { sql, poolPromise } = require('./db_config');
const router = express.Router();

// Helper for OP10 query
const buildOp10Query = (whereClause) => `
    SELECT 
        CreatedTime,
        Code,
        ProductStatus,
        Production_Circle1_Diameter,
        Production_Circle2_Diameter,
        Production_Circle3_Diameter,
        Production_CenterDist1,
        Production_CenterDist2,
        Production_CenterDist3,
        Production_PhotoResult1,
        Production_PhotoResult2,
        Production_PhotoResult3
    FROM op10_table
    ${whereClause}
    ORDER BY CreatedTime DESC
`;

// Helper for OP20 query
const buildOp20Query = (whereClause) => `
    SELECT 
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
        PressDisplacement_Back
    FROM op20_table
    ${whereClause}
    ORDER BY CreatedTime DESC
`;

// Generic function to handle paginated requests
const handlePaginatedRequest = async (req, res, tableName, queryBuilder) => {
    try {
        const { current = 1, pageSize = 20, startTime, endTime, code, status } = req.query;
        const pool = await poolPromise;
        const offset = (current - 1) * pageSize;
        
        let whereClause = "WHERE 1=1";
        const request = pool.request();

        if (startTime) {
            whereClause += " AND CreatedTime >= @startTime";
            request.input('startTime', sql.VarChar, startTime);
        }
        if (endTime) {
            whereClause += " AND CreatedTime <= @endTime";
            request.input('endTime', sql.VarChar, endTime);
        }
        if (code) {
            whereClause += " AND Code LIKE @code";
            request.input('code', sql.VarChar, `%${code}%`);
        }
        if (status) {
            whereClause += " AND ProductStatus = @status";
            request.input('status', sql.Int, parseInt(status));
        }

        // 1. Get Total Count
        const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
        const countResult = await request.query(countQuery);
        const total = countResult.recordset[0].total;

        // 2. Get Data Page
        const dataRequest = pool.request();
        if (startTime) dataRequest.input('startTime', sql.VarChar, startTime);
        if (endTime) dataRequest.input('endTime', sql.VarChar, endTime);
        if (code) dataRequest.input('code', sql.VarChar, `%${code}%`);
        if (status) dataRequest.input('status', sql.Int, parseInt(status));

        const baseQuery = queryBuilder(whereClause);
        const pagedQuery = `
            ${baseQuery}
            OFFSET ${offset} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
        `;
        
        const dataResult = await dataRequest.query(pagedQuery);

        res.json({
            data: dataResult.recordset,
            total: total,
            success: true,
            pageSize: parseInt(pageSize),
            current: parseInt(current),
        });

    } catch (err) {
        console.error(`Error fetching admin ${tableName} data:`, err);
        res.status(500).json({ success: false, error: `Failed to fetch ${tableName} data` });
    }
};

// OP10 Production Data API
router.get('/production/op10', async (req, res) => {
    await handlePaginatedRequest(req, res, 'op10_table', buildOp10Query);
});

// OP20 Production Data API
router.get('/production/op20', async (req, res) => {
    await handlePaginatedRequest(req, res, 'op20_table', buildOp20Query);
});

module.exports = router;
