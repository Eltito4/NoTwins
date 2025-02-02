import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { scrapeProduct } from '../utils/scraping/index.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all messages for current user
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { toUserId: req.user.id },
        { fromUserId: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    // Get user info for senders/receivers
    const userIds = [...new Set(messages.flatMap(m => [m.fromUserId, m.toUserId]))];
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    // Add user info to messages
    const messagesWithUsers = messages.map(msg => ({
      ...msg.toObject(),
      from: userMap[msg.fromUserId],
      to: userMap[msg.toUserId]
    }));

    res.json(messagesWithUsers);
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message
router.post('/', async (req, res) => {
  try {
    const { toUserId, title, body, suggestedItemUrl, relatedDressId } = req.body;

    // Validate required fields
    if (!toUserId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create message data
    const messageData = {
      fromUserId: req.user.id,
      toUserId,
      title: title.trim(),
      body: body.trim(),
      relatedDressId
    };

    // If there's a suggested item URL, fetch its details
    if (suggestedItemUrl) {
      try {
        const itemDetails = await scrapeProduct(suggestedItemUrl);
        messageData.suggestedItemUrl = suggestedItemUrl;
        messageData.suggestedItemDetails = {
          name: itemDetails.name,
          imageUrl: itemDetails.imageUrl,
          price: itemDetails.price,
          color: itemDetails.color
        };
      } catch (error) {
        logger.error('Error scraping suggested item:', error);
      }
    }

    const message = new Message(messageData);
    await message.save();

    // Get user info for response
    const [fromUser, toUser] = await Promise.all([
      User.findById(req.user.id),
      User.findById(toUserId)
    ]);

    const messageWithUsers = {
      ...message.toObject(),
      from: fromUser,
      to: toUser
    };

    res.status(201).json(messageWithUsers);
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark message as read
router.put('/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.toUserId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to mark this message as read' });
    }

    message.readAt = new Date();
    await message.save();

    res.json(message);
  } catch (error) {
    logger.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.toUserId !== req.user.id && message.fromUserId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;