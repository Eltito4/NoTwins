import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  aiAssistance: {
    totalSuggestionsRequested: { type: Number, default: 0 },
    totalSuggestionsClicked: { type: Number, default: 0 },
    favoriteCategories: [String],
    averageConfidenceScore: { type: Number, default: 0 },
    lastAiInteraction: Date,
    aiPreferences: {
      preferredBudget: {
        type: String,
        enum: ['budget', 'mid', 'premium', 'all'],
        default: 'all'
      },
      preferredRetailers: [String],
      stylePreferences: [String]
    }
  },
  engagement: {
    totalEvents: { type: Number, default: 0 },
    totalItemsAdded: { type: Number, default: 0 },
    totalDuplicatesDetected: { type: Number, default: 0 },
    totalMessagesSent: { type: Number, default: 0 },
    totalMessagesReceived: { type: Number, default: 0 },
    lastActivity: Date,
    accountAge: Number, // Days since registration
    activityScore: { type: Number, default: 0 } // Calculated engagement score
  },
  monetization: {
    totalProductClicks: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    totalCommissionGenerated: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    favoriteRetailers: [String],
    lastPurchase: Date,
    lifetimeValue: { type: Number, default: 0 }
  },
  demographics: {
    country: String,
    city: String,
    ageRange: {
      type: String,
      enum: ['18-24', '25-34', '35-44', '45-54', '55+']
    },
    preferredLanguage: {
      type: String,
      default: 'en'
    }
  },
  flags: {
    isVip: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    isInfluencer: { type: Boolean, default: false },
    needsAttention: { type: Boolean, default: false },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
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

export default mongoose.model('UserProfile', userProfileSchema);