const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

// CORS setup
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

// Add Taxpayer
app.post('/taxpayers', async (req, res) => {
    const {
        first_name, last_name, email, phone_no, address, city, state, country,
        dob, occupation, marital_stat, employment_stat, ssn, salary
    } = req.body;

    try {
        await db.query(
            `CALL insert_taxpayer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, email, phone_no, address, city, state, country,
                dob, occupation, marital_stat, employment_stat, ssn, salary
            ]
        );
        res.status(201).json({ message: 'Taxpayer added successfully' });
    } catch (error) {
        console.error('Error adding taxpayer:', error.message);
        res.status(500).json({ error: 'Failed to add taxpayer', details: error.message });
    }
});

// Get All Taxpayers
app.get('/taxpayers', async (req, res) => {
    try {
        console.log('Fetching taxpayers...');
        const [rows] = await db.query('SELECT * FROM Taxpayer LIMIT 1000');
        // Parse salary as a number
        const parsedRows = rows.map(row => ({
            ...row,
            salary: row.salary != null ? parseFloat(row.salary) : 0
        }));
        console.log(`Fetched ${parsedRows.length} taxpayers`);
        res.json(parsedRows);
    } catch (error) {
        console.error('Error fetching taxpayers:', error.message);
        res.status(500).json({ error: 'Failed to fetch taxpayers', details: error.message });
    }
});

// Search Taxpayer
app.get('/search-taxpayer', async (req, res) => {
    const { name, phone } = req.query;
    try {
        let query = 'SELECT * FROM Taxpayer WHERE CONCAT(first_name, " ", last_name) LIKE ?';
        let params = [`%${name}%`];

        if (phone) {
            query += ' AND phone_no = ?';
            params.push(phone);
        }

        const [rows] = await db.query(query, params);
        const parsedRows = rows.map(row => ({
            ...row,
            salary: row.salary != null ? parseFloat(row.salary) : 0
        }));
        res.json(parsedRows);
    } catch (error) {
        console.error('Error searching taxpayer:', error);
        res.status(500).json({ error: 'Failed to search taxpayer' });
    }
});

// Get Fraudulent Taxpayers
app.get('/fraudulent-taxpayers', async (req, res) => {
    try {
        const [rows] = await db.query('CALL get_high_risk_taxpayers()');
        const parsedRows = rows[0].map(row => ({
            ...row,
            salary: row.salary != null ? parseFloat(row.salary) : 0
        }));
        res.json(parsedRows);
    } catch (error) {
        console.error('Error fetching fraudulent taxpayers:', error);
        res.status(500).json({ error: 'Failed to fetch fraudulent taxpayers' });
    }
});

// Get Fraud Trends
app.get('/fraud-trends', async (req, res) => {
    try {
        const [result] = await db.query('CALL get_fraud_trends()');
        // Flatten the result set (stored procedures return nested arrays)
        const rows = Array.isArray(result) && result.length > 0 ? result[0] : result;
        const parsedRows = rows.map(row => ({
            month: row.month,
            fraud_count: parseInt(row.fraud_count, 10) // Ensure fraud_count is a number
        }));
        console.log('Fraud trends data:', parsedRows);
        res.json(parsedRows);
    } catch (error) {
        console.error('Error fetching fraud trends:', error);
        res.status(500).json({ error: 'Failed to fetch fraud trends', details: error.message });
    }
});

// Locality Analysis
app.get('/locality-analysis', async (req, res) => {
    const { city } = req.query;
    try {
        const [total] = await db.query('SELECT COUNT(*) as total FROM Taxpayer WHERE city = ?', [city]);
        const [fraud] = await db.query(`
            SELECT COUNT(DISTINCT t.taxpayer_id) as fraud_count 
            FROM Taxpayer t 
            JOIN Transaction tr ON t.taxpayer_id = tr.taxpayer_id 
            JOIN Fraud_Flags f ON tr.transaction_id = f.transaction_id 
            WHERE t.city = ?
        `, [city]);
        res.json({
            total_taxpayers: total[0].total,
            fraud_count: fraud[0].fraud_count
        });
    } catch (error) {
        console.error('Error in locality analysis:', error);
        res.status(500).json({ error: 'Failed to analyze locality' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});