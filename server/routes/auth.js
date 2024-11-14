import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Input validation middleware
const validateAuthInput = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
};

// Register
router.post('/register', validateAuthInput, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim()
    });

    const savedUser = await user.save();

    // Create token
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = {
      id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name
    };

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', validateAuthInput, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name
    };

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

export default router;