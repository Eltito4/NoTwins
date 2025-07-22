import express from 'express';
import Dress from '../models/Dress.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { generateDuplicateSuggestions, trackSuggestionInteraction } from '../utils/suggestions/aiSuggestions.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(authMiddleware);

// Get suggestions for a duplicate item
router.post('/duplicate/:dressId', async (req, res) => {
  try {
    const { dressId } = req.params;

    logger.info('Getting suggestions for dress:', { dressId, userId: req.user.id });

    // Get the duplicate item
    const duplicateItem = await Dress.findById(dressId);
    if (!duplicateItem) {
      logger.error('Dress not found:', { dressId });
      return res.status(404).json({ error: 'Item not found' });
    }

    logger.info('Found duplicate item:', { 
      name: duplicateItem.name, 
      userId: duplicateItem.userId,
      eventId: duplicateItem.eventId 
    });

    // Get the event context
    const event = await Event.findById(duplicateItem.eventId);
    if (!event) {
      logger.error('Event not found:', { eventId: duplicateItem.eventId });
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user has access to this event
    if (!event.participants.includes(req.user.id)) {
      logger.error('Access denied to event:', { 
        eventId: event._id, 
        userId: req.user.id,
        participants: event.participants 
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    logger.info('Event access verified:', { eventName: event.name });

    // Get user's other items in this event
    const userOtherItems = await Dress.find({
      eventId: duplicateItem.eventId,
      userId: req.user.id,
      _id: { $ne: dressId } // Exclude the duplicate item
    });

    logger.info('Found user other items:', { count: userOtherItems.length });

    // Generate AI suggestions
    logger.info('Generating AI suggestions...');
    const suggestions = await generateDuplicateSuggestions(
      duplicateItem,
      userOtherItems,
      {
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description
      }
    );

    logger.info('AI suggestions generated:', { count: suggestions.length });

    // Track that suggestions were viewed
    await trackSuggestionInteraction('batch', 'viewed', req.user.id);

    res.json({
      duplicateItem: {
        id: duplicateItem._id,
        name: duplicateItem.name,
        color: duplicateItem.color,
        brand: duplicateItem.brand,
        type: duplicateItem.type
      },
      event: {
        name: event.name,
        date: event.date,
        location: event.location
      },
      userOtherItems: userOtherItems.map(item => ({
        name: item.name,
        color: item.color,
        type: item.type
      })),
      suggestions: suggestions,
      suggestionsCount: suggestions.length
    });
  } catch (error) {
    logger.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Track suggestion interaction
router.post('/track', async (req, res) => {
  try {
    const { suggestionId, action, metadata } = req.body;

    if (!suggestionId || !action) {
      return res.status(400).json({ error: 'Suggestion ID and action are required' });
    }

    await trackSuggestionInteraction(suggestionId, action, req.user.id);

    // Special handling for product clicks (future commission tracking)
    if (action === 'product_click' && metadata?.productUrl) {
      logger.info('Product click tracked for future commission:', {
        userId: req.user.id,
        productUrl: metadata.productUrl,
        retailer: metadata.retailer,
        timestamp: metadata.timestamp
      });
    }
    res.json({ success: true, message: 'Interaction tracked' });
  } catch (error) {
    logger.error('Error tracking suggestion interaction:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// Get suggestion analytics (future feature for sponsors)
router.get('/analytics/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is event creator
    const event = await Event.findById(eventId);
    if (!event || event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TODO: Implement analytics for suggestion performance
    // This will help sponsors understand conversion rates
    
    res.json({
      message: 'Analytics feature coming soon',
      eventId,
      futureFeature: true
    });
  } catch (error) {
    logger.error('Error fetching suggestion analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;