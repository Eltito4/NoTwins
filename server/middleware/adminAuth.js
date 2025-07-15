import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Admin access required' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is admin
    const admin = await Admin.findOne({ userId: decoded.id, isActive: true });
    if (!admin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    req.user = decoded;
    req.admin = admin;
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(401).json({ error: 'Invalid admin token' });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.admin.role === 'super_admin' || req.admin.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: `Permission required: ${permission}` });
    }
  };
};