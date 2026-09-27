const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─────────────────────────────────────────────
//  JSON File-Based Persistent Database
//  All data is saved to backend/data/enquiries.json
//  Survives server restarts, refreshes, logouts
// ─────────────────────────────────────────────
const DB_FILE = path.join(__dirname, 'data', 'enquiries.json');

// Ensure the data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Ensure the JSON file exists and is valid
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]', 'utf8');
}

// Load all enquiries from the JSON file
function loadEnquiries() {
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw.trim() || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Error reading enquiries.json, resetting:', e.message);
        fs.writeFileSync(DB_FILE, '[]', 'utf8');
        return [];
    }
}

// Save all enquiries to the JSON file
function saveEnquiries(enquiries) {
    fs.writeFileSync(DB_FILE, JSON.stringify(enquiries, null, 2), 'utf8');
}

console.log('✅ Persistent JSON database ready at:', DB_FILE);
console.log('✅ Total enquiries stored:', loadEnquiries().length);

// ─────────────────────────────────────────────
//  API Routes
// ─────────────────────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Submit a new enquiry (from admission form)
app.post('/api/enquiries', (req, res) => {
    const { name, email, phone, course_interested, city, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
    }

    const enquiries = loadEnquiries();

    const newEnquiry = {
        id: Date.now(),
        name: name || '',
        email: email || '',
        phone: phone || '',
        city: city || '',
        course_interested: course_interested || '',
        message: message || '',
        status: 'Pending',
        created_at: new Date().toISOString()
    };

    enquiries.push(newEnquiry);
    saveEnquiries(enquiries);

    console.log(`✅ New enquiry saved: ${name} (${email}) - Total: ${enquiries.length}`);
    res.json({ message: 'Enquiry submitted successfully!', id: newEnquiry.id });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'aekanth' && password === 'aekanth190406') {
        res.json({ success: true, token: 'admin-auth-token-aekanth' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
    }
});

// Get all enquiries for admin dashboard
app.get('/api/admin/enquiries', (req, res) => {
    const enquiries = loadEnquiries();
    // Return sorted newest first
    const sorted = [...enquiries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(sorted);
});

// Update enquiry status (Accept / Reject)
app.put('/api/admin/enquiries/:id/status', (req, res) => {
    const id = String(req.params.id);
    const { status } = req.body;

    const enquiries = loadEnquiries();
    const idx = enquiries.findIndex(e => String(e.id) === id);

    if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    enquiries[idx].status = status;
    saveEnquiries(enquiries);

    console.log(`✅ Enquiry ${id} status updated to: ${status}`);
    res.json({ success: true, message: `Status updated to ${status}` });
});

// Update fee information
app.put('/api/admin/enquiries/:id/fee', (req, res) => {
    const id = String(req.params.id);
    const { fee_paid, fee_pending } = req.body;

    const enquiries = loadEnquiries();
    const idx = enquiries.findIndex(e => String(e.id) === id);

    if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    enquiries[idx].fee_paid = fee_paid;
    enquiries[idx].fee_pending = fee_pending;
    saveEnquiries(enquiries);

    console.log(`✅ Enquiry ${id} fee updated. Paid: ${fee_paid}, Pending: ${fee_pending}`);
    res.json({ success: true, message: `Fee information updated successfully.` });
});

// Delete enquiry
app.delete('/api/admin/enquiries/:id', (req, res) => {
    const id = String(req.params.id);
    const enquiries = loadEnquiries();
    const filtered = enquiries.filter(e => String(e.id) !== id);

    if (filtered.length === enquiries.length) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    saveEnquiries(filtered);
    console.log(`🗑️ Enquiry ${id} deleted. Remaining: ${filtered.length}`);
    res.json({ success: true, message: 'Enquiry deleted successfully.' });
});

// Get courses (static for now, can be extended)
app.get('/api/courses', (req, res) => {
    res.json([]);
});

// Admin portal route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Academy route
app.get('/academy', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/academy.html'));
});


// Catch-all: serve frontend
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Data stored permanently in: ${DB_FILE}`);
});
