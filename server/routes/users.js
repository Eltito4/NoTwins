import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Dress from '../models/Dress.js';
import Event from '../models/Event.js';
import { logger } from '../utils/logger.js';

const router = Router();

const profileSchema = z.object({
  name: z.string().min(1),
  avatar: z.string().url().optional()
});

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    let user = await User.findOne({ firebaseId: req.user.uid });
    
    if (!user) {
      user = new User({
        firebaseId: req.user.uid,
        email: req.user.email,
        name: req.user.name || 'Anonymous'
      });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const profileData = profileSchema.parse(req.body);
    const user = await User.findOneAndUpdate(
      { firebaseId: req.user.uid },
      profileData,
      { new: true }
    );
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user's dress statistics
router.get('/stats', async (req, res, next) => {
  try {
    const totalDresses = await Dress.countDocuments({ userId: req.user.uid });
    const totalEvents = await Event.countDocuments({
      participants: req.user.uid
    });
    
    res.json({
      totalDresses,
      totalEvents
    });
  } catch (error) {
    next(error);
  }
});

export default router;