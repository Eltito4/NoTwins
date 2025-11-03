import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  type: {
    type: String,
    enum: ['event_broadcast', 'duplicate_alert', 'direct_message'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  suggestedItemUrl: {
    type: String,
    trim: true
  },
  suggestedItemDetails: {
    name: String,
    imageUrl: String,
    price: Number,
    color: String,
    brand: String
  },
  relatedDressIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dress'
  }],
  duplicateInfo: {
    duplicateType: {
      type: String,
      enum: ['exact', 'partial']
    },
    conflictingItems: [{
      dressId: mongoose.Schema.Types.ObjectId,
      userId: String,
      userName: String,
      itemName: String,
      color: String
    }]
  },
  readAt: {
    type: Date
  },
  isRead: {
    type: Boolean,
    default: false
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

// Add indexes for efficient queries
messageSchema.index({ fromUserId: 1, toUserId: 1 });
messageSchema.index({ toUserId: 1, isRead: 1 });
messageSchema.index({ eventId: 1, type: 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model('Message', messageSchema);