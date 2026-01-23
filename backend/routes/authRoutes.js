const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate consistent tokens
const generateToken = (id) => {
  // We use 'userId' here because authMiddleware checks for 'decoded.userId'
  return jwt.sign({ userId: id }, process.env.SECRET_KEY, { expiresIn: '30d' });
};

// @desc    Register a new PLAYER (Public)
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // FORCE role to be 'user'. 
    // Admins/Managers are ONLY created via the Admin Panel (adminRoutes.js)
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: 'user',       // New Field
      isAdmin: false      // Deprecated but kept for compatibility
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Login & Get Token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,      // Frontend needs this to decide which Dashboard to show
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;