const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Helper to generate consistent tokens
const generateToken = (id) => {
  // We use 'userId' here because authMiddleware checks for 'decoded.userId'
  return jwt.sign({ userId: id }, process.env.SECRET_KEY, { expiresIn: '30d' });
};

// @desc    Register a new PLAYER (Public)
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', authLimiter, [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(400);
       throw new Error(errors.array()[0].msg);
    }
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
router.post('/login', authLimiter, [
  body('email').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(400);
       throw new Error(errors.array()[0].msg);
    }
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