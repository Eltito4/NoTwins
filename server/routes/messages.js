import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { scrapeProduct } from '../utils/scraping/index.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { toUserId: req.user.id },
        { fromUserId: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    const userIds = [...new Set(messages.flatMap(m => [m.fromUserId, m.toUserId]))];
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

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

router.post('/', async (req, res) => {
  try {
    const { toUserId, title, body, suggestedItemUrl, relatedDressId } = req.body;

    if (!toUserId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const messageData = {
      fromUserId: req.user.id,
      toUserId,
      title: title.trim(),
      body: body.trim(),
      relatedDressId
    };

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

router.delete('/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.toUserId !== req.user.id && message.fromUserId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;