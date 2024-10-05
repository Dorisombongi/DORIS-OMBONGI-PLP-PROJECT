const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Registration Endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Internal server error.' });
            }
            res.status(201).json({ message: 'User registered successfully.' });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Retrieve the user from the database
        const query = 'SELECT * FROM users WHERE username = ?';
        db.query(query, [username], async (err, results) => {
            if (err) {
                console.error('Error retrieving user:', err);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            // If user not found
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid username or password.' });
            }

            const user = results[0];

            // Compare the provided password with the hashed password
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({ message: 'Invalid username or password.' });
            }

            // Successful login
            res.status(200).json({ 
                message: 'Login successful.', 
                userId: user.id // Assuming the user's ID is stored in user.id
            });
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Period entry route
app.post('/api/period-entry', (req, res) => {
    const { userId, startDate, endDate } = req.body;
    const sql = 'INSERT INTO PeriodEntry (userId, startDate, endDate) VALUES (?, ?, ?)';

    db.query(sql, [userId, startDate, endDate], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving period entry');
        }
        res.status(200).send('Period entry saved');
    });
});

// Period view route
app.get('/api/period-entries/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT id, startDate, endDate FROM PeriodEntry WHERE userId = ? ORDER BY startDate DESC';

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching period entries');
        }
        res.status(200).json(results);
    });
});

// Delete period entry
app.delete('/api/period-entry/:id', (req, res) => {
    const entryId = req.params.id;
    const userId = req.body.userId; // Get userId from request body

    if (!entryId || !userId) {
        return res.status(400).send('Entry ID and User ID are required');
    }

    const sql = 'DELETE FROM PeriodEntry WHERE id = ? AND userId = ?';
    db.query(sql, [entryId, userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error deleting period entry');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Period entry not found or you do not have permission to delete it');
        }
        res.status(200).send('Period entry deleted successfully');
    });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
