import UserActivity from '../models/UserActivity.js';
import UserProfile from '../models/UserProfile.js';
import { logger } from '../logger.js';

export async function trackUserActivity(userId, activityType, details = {}, metadata = {}) {
  try {
    // Create activity record
    const activity = new UserActivity({
      userId,
      activityType,
      details,
      metadata: {
        ...metadata,
        timestamp: new Date()
      }
    });

    await activity.save();

    // Update user profile based on activity
    await updateUserProfile(userId, activityType, details);

    logger.debug('User activity tracked:', {
      userId,
      activityType,
      hasDetails: Object.keys(details).length > 0
    });

  } catch (error) {
    logger.error('Error tracking user activity:', error);
  }
}

async function updateUserProfile(userId, activityType, details) {
  try {
    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    // Update based on activity type
    switch (activityType) {
      case 'ai_suggestion_requested':
        profile.aiAssistance.totalSuggestionsRequested += 1;
        profile.aiAssistance.lastAiInteraction = new Date();
        if (details.aiConfidence) {
          const currentAvg = profile.aiAssistance.averageConfidenceScore || 0;
          const currentCount = profile.aiAssistance.totalSuggestionsRequested;
          profile.aiAssistance.averageConfidenceScore = 
            (currentAvg * (currentCount - 1) + details.aiConfidence) / currentCount;
        }
        break;

      case 'ai_suggestion_clicked':
        profile.aiAssistance.totalSuggestionsClicked += 1;
        break;

      case 'product_link_clicked':
        profile.monetization.totalProductClicks += 1;
        if (details.retailer) {
          if (!profile.monetization.favoriteRetailers.includes(details.retailer)) {
            profile.monetization.favoriteRetailers.push(details.retailer);
          }
        }
        if (details.clickValue) {
          profile.monetization.totalCommissionGenerated += details.clickValue;
        }
        break;

      case 'event_created':
        profile.engagement.totalEvents += 1;
        break;

      case 'item_added':
        profile.engagement.totalItemsAdded += 1;
        break;

      case 'duplicate_detected':
        profile.engagement.totalDuplicatesDetected += 1;
        break;

      case 'message_sent':
        profile.engagement.totalMessagesSent += 1;
        break;
    }

    // Update last activity and calculate engagement score
    profile.engagement.lastActivity = new Date();
    profile.engagement.activityScore = calculateEngagementScore(profile);

    await profile.save();

  } catch (error) {
    logger.error('Error updating user profile:', error);
  }
}

function calculateEngagementScore(profile) {
  // Simple engagement scoring algorithm
  const weights = {
    events: 10,
    items: 5,
    messages: 3,
    aiUsage: 8,
    purchases: 15
  };

  const score = 
    (profile.engagement.totalEvents * weights.events) +
    (profile.engagement.totalItemsAdded * weights.items) +
    (profile.engagement.totalMessagesSent * weights.messages) +
    (profile.aiAssistance.totalSuggestionsRequested * weights.aiUsage) +
    (profile.monetization.totalPurchases * weights.purchases);

  return Math.min(score, 1000); // Cap at 1000
}

export async function trackProductClick(userId, productUrl, retailer, price, suggestionId) {
  // Calculate potential commission (example: 5% of product price)
  const commissionRate = 0.05;
  const clickValue = price ? price * commissionRate : 0;

  await trackUserActivity(userId, 'product_link_clicked', {
    productUrl,
    retailer,
    price,
    clickValue,
    suggestionId
  });
}

export async function trackAiSuggestion(userId, suggestionType, confidence, eventId) {
  await trackUserActivity(userId, 'ai_suggestion_requested', {
    suggestionType,
    aiConfidence: confidence,
    eventId
  });
}

export async function trackLogin(userId, metadata) {
  await trackUserActivity(userId, 'login', {}, metadata);
}

export async function trackDuplicateDetection(userId, eventId, duplicateType, itemNames) {
  await trackUserActivity(userId, 'duplicate_detected', {
    eventId,
    duplicateType,
    itemNames
  });
}