const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfashionkey';

// Helper to generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

// 1. Register
router.post('/register', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        
        // Check if user exists
        const [existing] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Mobile number already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (name, phone, email, password_hash) VALUES (?, ?, ?, ?)',
            [name, phone, email, hashedPassword]
        );

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        await pool.query(
            'INSERT INTO otps (phone, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
            [phone, otp, 'register', expiresAt]
        );

        // DEV ONLY: Print OTP to console instead of sending SMS
        console.log(`\n=========================================\n🔑 TEST OTP FOR REGISTRATION: ${otp}\n=========================================\n`);

        res.json({ message: 'Registration successful. Please verify OTP.', phone });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// 2. Verify OTP (Registration & General)
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp, purpose } = req.body;

        const [otps] = await pool.query(
            'SELECT * FROM otps WHERE phone = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1',
            [phone, purpose]
        );

        if (otps.length === 0) return res.status(400).json({ error: 'No OTP found.' });

        const otpRecord = otps[0];
        if (new Date() > new Date(otpRecord.expires_at)) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
        }

        if (otpRecord.otp_code !== otp) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

        // Delete OTP after success
        await pool.query('DELETE FROM otps WHERE id = ?', [otpRecord.id]);

        if (purpose === 'register') {
            await pool.query('UPDATE users SET is_verified = TRUE WHERE phone = ?', [phone]);
            const [user] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
            const token = jwt.sign({ id: user[0].id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ message: 'Account created and verified successfully.', token });
        }
        
        if (purpose === 'login') {
            const [user] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
            if (user.length === 0) return res.status(404).json({ error: 'User not found.' });
            const token = jwt.sign({ id: user[0].id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ message: 'Logged in successfully.', token });
        }

        res.json({ message: 'OTP verified successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during OTP verification.' });
    }
});

// 3. Login (Password)
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid mobile number or password.' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            return res.status(401).json({ error: 'Invalid mobile number or password.' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your account first.', require_otp: true });
        }

        const token = jwt.sign({ id: user.id, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful.', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// 4. Request OTP for Login
router.post('/request-otp-login', async (req, res) => {
    try {
        const { phone } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Mobile number not registered.' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

        await pool.query(
            'INSERT INTO otps (phone, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
            [phone, otp, 'login', expiresAt]
        );

        console.log(`\n=========================================\n🔑 TEST OTP FOR LOGIN: ${otp}\n=========================================\n`);

        res.json({ message: 'OTP sent successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error requesting OTP.' });
    }
});

// 5. Get User Profile (Protected)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, phone, email, is_verified, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching profile.' });
    }
});

module.exports = router;
