import express from 'express';
import Event from '../models/Event.js';
import Dress from '../models/Dress.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';
import { eventLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

router.use(authMiddleware);
router.use(eventLimiter);

// Get all events for a user
router.get('/', cacheMiddleware(30), async (req, res) => {
  try {
    const includeParticipants = req.query.includeParticipants === 'true';

    const events = await Event.find({
      $or: [
        { creatorId: req.user.id },
        { participants: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    // If includeParticipants is true, fetch all participants in a single query
    if (includeParticipants && events.length > 0) {
      // Get all unique participant IDs across all events
      const allParticipantIds = [...new Set(events.flatMap(e => e.participants))];

      // Fetch all users in a single query
      const users = await User.find({
        _id: { $in: allParticipantIds }
      }).select('_id name email').lean();

      // Create a map for quick lookup
      const userMap = {};
      users.forEach(user => {
        userMap[user._id.toString()] = {
          id: user._id,
          name: user.name,
          email: user.email
        };
      });

      // Attach participant details to each event
      const eventsWithParticipants = events.map(event => {
        const eventObj = event.toJSON(); // Use toJSON instead of toObject to apply the id transform
        eventObj.participantDetails = event.participants
          .map(participantId => {
            const user = userMap[participantId.toString()];
            if (user) {
              return {
                ...user,
                isCreator: event.creatorId === participantId.toString()
              };
            }
            return null;
          })
          .filter(Boolean);
        return eventObj;
      });

      return res.json(eventsWithParticipants);
    }

    res.json(events);
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event participants
router.get('/:eventId/participants', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only allow creator or participants to view participant info
    if (!event.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.find({ 
      _id: { $in: event.participants }
    }).select('_id name email');

    // Map users to include isCreator flag
    const mappedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      isCreator: event.creatorId === user._id.toString()
    }));

    res.json(mappedUsers);
  } catch (error) {
    logger.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Create a new event
router.post('/', async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      creatorId: req.user.id,
      participants: [req.user.id],
      shareId: Math.random().toString(36).substring(2, 8).toUpperCase()
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Delete an event
router.delete('/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the event creator can delete this event' });
    }

    await Dress.deleteMany({ eventId: event.id });
    await event.deleteOne();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Join an event using shareId
router.post('/join/:shareId', async (req, res) => {
  try {
    const event = await Event.findOne({ shareId: req.params.shareId });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.participants.includes(req.user.id)) {
      event.participants.push(req.user.id);
      await event.save();
    }

    res.json(event);
  } catch (error) {
    logger.error('Error joining event:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

export default router;