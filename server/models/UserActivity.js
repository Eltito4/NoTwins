import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  activityType: {
    type: String,
    enum: [
      'login',
      'logout',
      'event_created',
      'event_joined',
      'item_added',
      'item_deleted',
      'ai_suggestion_requested',
      'ai_suggestion_clicked',
      'product_link_clicked',
      'message_sent',
      'duplicate_detected',
      'profile_updated'
    ],
    required: true
  },
  details: {
    itemName: String,
    suggestionType: String,
    productUrl: String,
    retailer: String,
    price: Number,
    currency: String,
    clickValue: Number, // Potential commission value
    aiConfidence: Number,
    duplicateType: String,
    messageType: String
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      city: String
    },
    deviceType: String,
    sessionId: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient queries
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ activityType: 1, timestamp: -1 });
userActivitySchema.index({ eventId: 1, timestamp: -1 });
userActivitySchema.index({ 'details.retailer': 1, timestamp: -1 });

export default mongoose.model('UserActivity', userActivitySchema);