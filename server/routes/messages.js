import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Dress from '../models/Dress.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { scrapeProduct } from '../utils/scraping/index.js';

const router = express.Router();

router.use(authMiddleware);

// Get messages for current user
router.get('/', async (req, res) => {
  try {
    // Use .populate() to fetch related user and event data in a single query
    const messages = await Message.find({
      toUserId: req.user.id
    })
    .populate('fromUserId', 'name email')
    .populate('toUserId', 'name email')
    .populate('eventId', 'name')
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for better performance (returns plain JS objects)

    // Format response with populated fields
    const messagesWithUsers = messages.map(msg => ({
      ...msg,
      from: msg.fromUserId,
      to: msg.toUserId,
      event: msg.eventId
    }));

    res.json(messagesWithUsers);
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send broadcast message to all event participants (event creator only)
router.post('/broadcast/:eventId', async (req, res) => {
  try {
    const { title, body, suggestedItemUrl } = req.body;
    const { eventId } = req.params;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Check if user is event creator
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Only event creator can send broadcast messages' });
    }

    // Get all participants except the creator
    const participants = event.participants.filter(p => p !== req.user.id);
    
    if (participants.length === 0) {
      return res.status(400).json({ error: 'No participants to send message to' });
    }

    // Scrape suggested item if URL provided
    let suggestedItemDetails = null;
    if (suggestedItemUrl) {
      try {
        const itemDetails = await scrapeProduct(suggestedItemUrl);
        suggestedItemDetails = {
          name: itemDetails.name,
          imageUrl: itemDetails.imageUrl,
          price: itemDetails.price,
          color: itemDetails.color,
          brand: itemDetails.brand
        };
      } catch (error) {
        logger.error('Error scraping suggested item:', error);
      }
    }

    // Create messages for all participants
    const messages = participants.map(participantId => ({
      fromUserId: req.user.id,
      toUserId: participantId,
      eventId: eventId,
      type: 'event_broadcast',
      title: title.trim(),
      body: body.trim(),
      suggestedItemUrl: suggestedItemUrl || undefined,
      suggestedItemDetails: suggestedItemDetails
    }));

    const createdMessages = await Message.insertMany(messages);

    // Get sender info
    const sender = await User.findById(req.user.id);

    res.status(201).json({
      message: `Broadcast sent to ${participants.length} participants`,
      messageCount: createdMessages.length,
      sender: sender
    });
  } catch (error) {
    logger.error('Error sending broadcast message:', error);
    res.status(500).json({ error: 'Failed to send broadcast message' });
  }
});

// Send direct message between users
router.post('/direct', async (req, res) => {
  try {
    const { toUserId, eventId, title, body, suggestedItemUrl, relatedDressIds } = req.body;

    logger.info('Direct message request:', {
      fromUserId: req.user.id,
      toUserId,
      eventId,
      title,
      hasBody: !!body,
      hasSuggestedUrl: !!suggestedItemUrl
    });

    if (!toUserId || !eventId || !title || !body) {
      logger.error('Missing required fields:', { toUserId, eventId, title, body });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify both users are in the same event
    const event = await Event.findById(eventId);
    if (!event) {
      logger.error('Event not found:', { eventId });
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.participants.includes(req.user.id) || !event.participants.includes(toUserId)) {
      logger.error('Users not in event:', {
        fromUserId: req.user.id,
        toUserId,
        eventParticipants: event.participants
      });
      return res.status(403).json({ error: 'Both users must be participants in the event' });
    }

    // Scrape suggested item if URL provided
    let suggestedItemDetails = null;
    if (suggestedItemUrl) {
      try {
        const itemDetails = await scrapeProduct(suggestedItemUrl);
        suggestedItemDetails = {
          name: itemDetails.name,
          imageUrl: itemDetails.imageUrl,
          price: itemDetails.price,
          color: itemDetails.color,
          brand: itemDetails.brand
        };
      } catch (error) {
        logger.error('Error scraping suggested item:', error);
      }
    }

    const messageData = {
      fromUserId: req.user.id,
      toUserId,
      eventId,
      type: 'direct_message',
      title: title.trim(),
      body: body.trim(),
      suggestedItemUrl: suggestedItemUrl || undefined,
      suggestedItemDetails: suggestedItemDetails,
      relatedDressIds: relatedDressIds || []
    };

    const message = new Message(messageData);
    await message.save();

    logger.info('Message saved successfully:', { messageId: message._id });

    // Get user info
    const [fromUser, toUser] = await Promise.all([
      User.findById(req.user.id),
      User.findById(toUserId)
    ]);

    const messageWithUsers = {
      ...message.toObject(),
      from: fromUser,
      to: toUser,
      event: event
    };

    res.status(201).json(messageWithUsers);
  } catch (error) {
    logger.error('Error sending direct message:', error);
    res.status(500).json({ error: 'Failed to send direct message' });
  }
});

// Send duplicate alert message
router.post('/duplicate-alert', async (req, res) => {
  try {
    const { toUserId, eventId, duplicateInfo, suggestedItemUrl } = req.body;

    if (!toUserId || !eventId || !duplicateInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify both users are in the same event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.participants.includes(req.user.id) || !event.participants.includes(toUserId)) {
      return res.status(403).json({ error: 'Both users must be participants in the event' });
    }

    const title = duplicateInfo.duplicateType === 'exact' 
      ? '🚨 Exact Duplicate Found!' 
      : '⚠️ Similar Item Found';

    const itemNames = duplicateInfo.conflictingItems.map(item => item.itemName).join(', ');
    const body = `You both have ${duplicateInfo.duplicateType === 'exact' ? 'the same' : 'similar'} item(s): ${itemNames}. Consider coordinating to avoid conflicts.`;

    // Scrape suggested item if URL provided
    let suggestedItemDetails = null;
    if (suggestedItemUrl) {
      try {
        const itemDetails = await scrapeProduct(suggestedItemUrl);
        suggestedItemDetails = {
          name: itemDetails.name,
          imageUrl: itemDetails.imageUrl,
          price: itemDetails.price,
          color: itemDetails.color,
          brand: itemDetails.brand
        };
      } catch (error) {
        logger.error('Error scraping suggested item:', error);
      }
    }

    const messageData = {
      fromUserId: req.user.id,
      toUserId,
      eventId,
      type: 'duplicate_alert',
      title,
      body,
      suggestedItemUrl: suggestedItemUrl || undefined,
      suggestedItemDetails: suggestedItemDetails,
      duplicateInfo,
      relatedDressIds: duplicateInfo.conflictingItems.map(item => item.dressId)
    };

    const message = new Message(messageData);
    await message.save();

    // Get user info
    const [fromUser, toUser] = await Promise.all([
      User.findById(req.user.id),
      User.findById(toUserId)
    ]);

    const messageWithUsers = {
      ...message.toObject(),
      from: fromUser,
      to: toUser,
      event: event
    };

    res.status(201).json(messageWithUsers);
  } catch (error) {
    logger.error('Error sending duplicate alert:', error);
    res.status(500).json({ error: 'Failed to send duplicate alert' });
  }
});

// Mark message as read
router.put('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!messageId || messageId === 'undefined') {
      return res.status(400).json({ error: 'Valid message ID is required' });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.toUserId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to mark this message as read' });
    }

    message.readAt = new Date();
    message.isRead = true;
    await message.save();

    res.json(message);
  } catch (error) {
    logger.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!messageId || messageId === 'undefined') {
      return res.status(400).json({ error: 'Valid message ID is required' });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.toUserId !== req.user.id && message.fromUserId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.countDocuments({
      toUserId: req.user.id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;