import express from 'express';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Dress from '../models/Dress.js';
import Message from '../models/Message.js';
import UserActivity from '../models/UserActivity.js';
import UserProfile from '../models/UserProfile.js';
import Admin from '../models/Admin.js';
import { adminAuthMiddleware, requirePermission } from '../middleware/adminAuth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(adminAuthMiddleware);

// Dashboard Overview
router.get('/dashboard', requirePermission('view_analytics'), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalItems = await Dress.countDocuments();
    const totalMessages = await Message.countDocuments();

    // Recent activity
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const newEventsThisWeek = await Event.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    // AI Usage
    const aiSuggestionsRequested = await UserActivity.countDocuments({
      activityType: 'ai_suggestion_requested',
      timestamp: { $gte: thirtyDaysAgo }
    });
    const productLinksClicked = await UserActivity.countDocuments({
      activityType: 'product_link_clicked',
      timestamp: { $gte: thirtyDaysAgo }
    });

    // Revenue potential
    const totalCommissionValue = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'product_link_clicked',
          'details.clickValue': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$details.clickValue' }
        }
      }
    ]);

    // Top retailers
    const topRetailers = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'product_link_clicked',
          'details.retailer': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$details.retailer',
          clicks: { $sum: 1 },
          totalValue: { $sum: '$details.clickValue' }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalEvents,
        totalItems,
        totalMessages,
        newUsersThisMonth,
        newEventsThisWeek
      },
      aiMetrics: {
        suggestionsRequested: aiSuggestionsRequested,
        productLinksClicked: productLinksClicked,
        conversionRate: aiSuggestionsRequested > 0 ? 
          (productLinksClicked / aiSuggestionsRequested * 100).toFixed(2) : 0
      },
      monetization: {
        totalCommissionValue: totalCommissionValue[0]?.total || 0,
        topRetailers: topRetailers
      }
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// User Management
router.get('/users', requirePermission('view_all_users'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Validate and sanitize inputs to prevent NoSQL injection
    const validSortFields = ['createdAt', 'name', 'email'];
    const sanitizedSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sanitizedOrder = order === 'asc' ? 1 : -1;
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Cap at 100
    const sanitizedPage = Math.max(parseInt(page) || 1, 1);

    let query = {};
    if (search && typeof search === 'string') {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);
      query = {
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { email: { $regex: escapedSearch, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .sort({ [sanitizedSortBy]: sanitizedOrder })
      .limit(sanitizedLimit)
      .skip((sanitizedPage - 1) * sanitizedLimit)
      .select('-password');

    // Get user profiles and activity
    const userIds = users.map(u => u._id);
    const profiles = await UserProfile.find({ userId: { $in: userIds } });
    const profileMap = Object.fromEntries(profiles.map(p => [p.userId.toString(), p]));

    const enrichedUsers = users.map(user => ({
      ...user.toObject(),
      profile: profileMap[user._id.toString()] || null
    }));

    const total = await User.countDocuments(query);

    res.json({
      users: enrichedUsers,
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        total,
        pages: Math.ceil(total / sanitizedLimit)
      }
    });
  } catch (error) {
    logger.error('Admin users list error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// User Detail
router.get('/users/:userId', requirePermission('view_all_users'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await UserProfile.findOne({ userId });
    const events = await Event.find({
      $or: [
        { creatorId: userId },
        { participants: userId }
      ]
    }).sort({ createdAt: -1 });

    const recentActivity = await UserActivity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    const items = await Dress.find({ userId }).sort({ createdAt: -1 });
    const messages = await Message.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    }).sort({ createdAt: -1 }).limit(20);

    res.json({
      user: user.toObject(),
      profile,
      events,
      recentActivity,
      items,
      messages
    });
  } catch (error) {
    logger.error('Admin user detail error:', error);
    res.status(500).json({ error: 'Failed to load user details' });
  }
});

// AI Analytics
router.get('/ai-analytics', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // AI suggestion metrics
    const suggestionMetrics = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'ai_suggestion_requested',
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            suggestionType: '$details.suggestionType'
          },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$details.aiConfidence' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Product click analytics
    const clickMetrics = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'product_link_clicked',
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            retailer: '$details.retailer',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          clicks: { $sum: 1 },
          totalValue: { $sum: '$details.clickValue' },
          avgPrice: { $avg: '$details.price' }
        }
      },
      { $sort: { clicks: -1 } }
    ]);

    // User engagement with AI
    const userEngagement = await UserProfile.aggregate([
      {
        $match: {
          'aiAssistance.totalSuggestionsRequested': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgSuggestions: { $avg: '$aiAssistance.totalSuggestionsRequested' },
          avgClicks: { $avg: '$aiAssistance.totalSuggestionsClicked' },
          avgConfidence: { $avg: '$aiAssistance.averageConfidenceScore' }
        }
      }
    ]);

    res.json({
      suggestionMetrics,
      clickMetrics,
      userEngagement: userEngagement[0] || {},
      dateRange: { start, end }
    });
  } catch (error) {
    logger.error('AI analytics error:', error);
    res.status(500).json({ error: 'Failed to load AI analytics' });
  }
});

// Revenue Analytics
router.get('/revenue-analytics', requirePermission('view_financial_data'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Commission tracking
    const commissionData = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'product_link_clicked',
          timestamp: { $gte: start, $lte: end },
          'details.clickValue': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            retailer: '$details.retailer',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          clicks: { $sum: 1 },
          potentialCommission: { $sum: '$details.clickValue' },
          avgOrderValue: { $avg: '$details.price' }
        }
      },
      { $sort: { potentialCommission: -1 } }
    ]);

    // Top performing users (by commission generation)
    const topUsers = await UserProfile.find({
      'monetization.totalCommissionGenerated': { $gt: 0 }
    })
    .sort({ 'monetization.totalCommissionGenerated': -1 })
    .limit(10)
    .populate('userId', 'name email');

    // Retailer performance
    const retailerPerformance = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'product_link_clicked',
          'details.retailer': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$details.retailer',
          totalClicks: { $sum: 1 },
          totalValue: { $sum: '$details.clickValue' },
          avgPrice: { $avg: '$details.price' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          retailer: '$_id',
          totalClicks: 1,
          totalValue: 1,
          avgPrice: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({
      commissionData,
      topUsers,
      retailerPerformance,
      dateRange: { start, end }
    });
  } catch (error) {
    logger.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to load revenue analytics' });
  }
});

// User Actions
router.put('/users/:userId/flag', requirePermission('manage_users'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { flag, value, reason } = req.body;

    const validFlags = ['isVip', 'isSuspended', 'isInfluencer', 'needsAttention'];
    if (!validFlags.includes(flag)) {
      return res.status(400).json({ error: 'Invalid flag' });
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    profile.flags[flag] = value;
    await profile.save();

    // Log admin action
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'admin_action',
      details: {
        action: 'user_flag_updated',
        targetUserId: userId,
        flag,
        value,
        reason
      }
    });

    res.json({ success: true, message: `User ${flag} updated` });
  } catch (error) {
    logger.error('User flag update error:', error);
    res.status(500).json({ error: 'Failed to update user flag' });
  }
});

// Export Data
router.get('/export/:type', requirePermission('export_data'), async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    let data;
    switch (type) {
      case 'users':
        data = await User.find().select('-password');
        break;
      case 'events':
        data = await Event.find();
        break;
      case 'activity':
        const query = {};
        if (startDate) query.timestamp = { $gte: new Date(startDate) };
        if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
        data = await UserActivity.find(query);
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // TODO: Implement CSV export
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.json`);
    }

    res.json(data);
  } catch (error) {
    logger.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Get Preferred Retailers
router.get('/retailers', requirePermission('view_analytics'), async (req, res) => {
  try {
    // For now, return default retailers
    // In the future, this would come from database
    const defaultRetailers = [
      {
        id: '1',
        name: 'Zara',
        domain: 'zara.com',
        searchUrl: 'https://www.zara.com/es/es/search?searchTerm=',
        priceRange: 'mid',
        priority: 10,
        isActive: true,
        commissionRate: 8,
        countries: ['ES', 'US', 'FR', 'IT'],
        description: 'Fast fashion leader with trendy designs'
      },
      {
        id: '2',
        name: 'Mango',
        domain: 'mango.com',
        searchUrl: 'https://shop.mango.com/es/search?q=',
        priceRange: 'mid',
        priority: 9,
        isActive: true,
        commissionRate: 7,
        countries: ['ES', 'US', 'FR'],
        description: 'Contemporary fashion with Mediterranean style'
      },
      {
        id: '3',
        name: 'H&M',
        domain: 'hm.com',
        searchUrl: 'https://www2.hm.com/es_es/search-results.html?q=',
        priceRange: 'budget',
        priority: 8,
        isActive: true,
        commissionRate: 6,
        countries: ['ES', 'US', 'FR', 'IT'],
        description: 'Affordable fashion for everyone'
      },
      {
        id: '4',
        name: 'Massimo Dutti',
        domain: 'massimodutti.com',
        searchUrl: 'https://www.massimodutti.com/es/search?q=',
        priceRange: 'premium',
        priority: 7,
        isActive: true,
        commissionRate: 10,
        countries: ['ES', 'US', 'FR', 'IT'],
        description: 'Premium fashion with sophisticated designs'
      },
      {
        id: '5',
        name: 'ASOS',
        domain: 'asos.com',
        searchUrl: 'https://www.asos.com/es/search/?q=',
        priceRange: 'mid',
        priority: 6,
        isActive: true,
        commissionRate: 5,
        countries: ['ES', 'US', 'UK', 'FR'],
        description: 'Online fashion destination for young adults'
      }
    ];

    res.json({
      retailers: defaultRetailers,
      total: defaultRetailers.length,
      active: defaultRetailers.filter(r => r.isActive).length
    });
  } catch (error) {
    logger.error('Get retailers error:', error);
    res.status(500).json({ error: 'Failed to get retailers' });
  }
});

// Update Preferred Retailers
router.put('/retailers', requirePermission('manage_ai_settings'), async (req, res) => {
  try {
    const { retailers } = req.body;
    
    if (!Array.isArray(retailers)) {
      return res.status(400).json({ error: 'Retailers must be an array' });
    }

    // TODO: Save to database
    // For now, just validate and return success
    logger.info('Retailers updated:', {
      count: retailers.length,
      active: retailers.filter(r => r.isActive).length,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Retailers updated successfully',
      retailers: retailers
    });
  } catch (error) {
    logger.error('Update retailers error:', error);
    res.status(500).json({ error: 'Failed to update retailers' });
  }
});

export default router;