import express from 'express';
import Dress from '../models/Dress.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';
import { eventLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { detectSmartDuplicates } from '../utils/duplicates/aiSimilarity.js';

const router = express.Router();

router.use(authMiddleware);
router.use(eventLimiter);

// Add a new item
router.post('/', async (req, res) => {
  try {
    const {
      eventId,
      name,
      imageUrl,
      description,
      color,
      brand,
      price,
      type,
      isPrivate
    } = req.body;

    // Validate required fields
    if (!eventId || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          eventId: !eventId ? 'Event ID is required' : null,
          name: !name ? 'Name is required' : null
        }
      });
    }

    // Check if event exists and user has access
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const item = new Dress({
      userId: req.user.id,
      eventId,
      name: name.trim(),
      imageUrl,
      description: description?.trim(),
      color: color?.trim(),
      brand: brand?.trim(),
      price: price ? parseFloat(price) : undefined,
      type: type ? {
        category: type.category,
        subcategory: type.subcategory,
        name: type.name
      } : undefined,
      isPrivate: Boolean(isPrivate)
    });

    const savedItem = await item.save();

    // Add item to event's dresses array
    event.dresses.push(savedItem._id);
    await event.save();

    // Check for smart duplicates with AI
    try {
      const eventDresses = await Dress.find({ eventId }).populate('userId', 'name');
      const existingItems = eventDresses
        .filter(d => d._id.toString() !== savedItem._id.toString())
        .map(d => ({
          ...d.toObject(),
          userName: d.userId?.name || 'Unknown User'
        }));
      
      const duplicates = await detectSmartDuplicates(savedItem.toObject(), existingItems);
      
      if (duplicates.length > 0) {
        logger.info('Smart duplicates detected:', {
          newItem: savedItem.name,
          duplicates: duplicates.map(d => ({ name: d.name, confidence: d.confidence }))
        });
        
        // TODO: Send notifications to users about potential duplicates
        // This could be implemented as real-time notifications or messages
      }
    } catch (error) {
      logger.error('Smart duplicate detection failed:', error);
      // Don't fail the item creation if duplicate detection fails
    }
    // Get user info
    const user = await User.findById(req.user.id);
    const itemWithUser = {
      ...savedItem.toObject(),
      userName: user ? user.name : 'Unknown User'
    };

    res.status(201).json(itemWithUser);
  } catch (error) {
    logger.error('Error creating item:', error);
    res.status(500).json({ 
      error: 'Failed to create item',
      details: error.message
    });
  }
});

// Get items for an event
router.get('/event/:eventId', cacheMiddleware(30), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { includePrivate } = req.query;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isEventCreator = event.creatorId === req.user.id;

    const query = {
      eventId,
      $or: [
        { isPrivate: false },
        { userId: req.user.id },
        ...(isEventCreator || includePrivate === 'true' ? [{}] : [])
      ]
    };

    const dresses = await Dress.find(query).sort({ createdAt: -1 });

    // Get user info for all dresses
    const userIds = [...new Set(dresses.map(dress => dress.userId))];
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = Object.fromEntries(users.map(user => [user._id.toString(), user]));

    // Add user names to dresses
    const dressesWithUsers = dresses.map(dress => ({
      ...dress.toObject(),
      userName: userMap[dress.userId] ? userMap[dress.userId].name : 'Unknown User'
    }));

    res.json(dressesWithUsers);
  } catch (error) {
    logger.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Update an item
router.put('/:dressId', async (req, res) => {
  try {
    const { dressId } = req.params;
    const updates = req.body;

    if (!dressId) {
      return res.status(400).json({ error: 'Dress ID is required' });
    }

    const dress = await Dress.findById(dressId);
    
    if (!dress) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user owns the dress
    if (dress.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update the dress
    const updatedDress = await Dress.findByIdAndUpdate(
      dressId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Get user info
    const user = await User.findById(req.user.id);
    const dressWithUser = {
      ...updatedDress.toObject(),
      userName: user ? user.name : 'Unknown User'
    };

    res.json(dressWithUser);
  } catch (error) {
    logger.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item
router.delete('/:dressId', async (req, res) => {
  try {
    if (!req.params.dressId) {
      return res.status(400).json({ error: 'Dress ID is required' });
    }

    const dress = await Dress.findById(req.params.dressId);
    
    if (!dress) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user owns the dress or is event creator
    const event = await Event.findById(dress.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (dress.userId !== req.user.id && event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove from event's dresses array first
    await Event.findByIdAndUpdate(dress.eventId, {
      $pull: { dresses: dress._id }
    });

    // Then delete the dress
    await dress.deleteOne();

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    logger.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;