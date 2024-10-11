const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'your_super_secret_key'; // Replace with your own secret key

// MongoDB connection setup
mongoose.connect('mongodb+srv://sy3dadnanali:Ibra1983%40@privatejetapp.y69kl.mongodb.net/?retryWrites=true&w=majority&appName=privatejetapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('Could not connect to MongoDB', err));

// User schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false } // Admin activation
});

const User = mongoose.model('User', userSchema);

// Registration route
app.post('/register', async (req, res) => {
    const { name, company, email, password } = req.body;

    if (!name || !company || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = new User({ name, company, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'Registration successful. Waiting for admin approval.' });
    } catch (err) {
        res.status(500).json({ message: 'User registration failed' });
    }
});

// Admin route to activate users
app.put('/admin/activate-user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.isActive = true;
        await user.save();
        res.json({ message: 'User activated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Activation failed' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
        return res.status(403).json({ message: 'Account not activated. Please contact admin.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	