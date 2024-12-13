import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  fromUserId: { 
    type: String, 
    required: true 
  },
  toUserId: { 
    type: String, 
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
    color: String
  },
  relatedDressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dress'
  },
  readAt: {
    type: Date
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
messageSchema.index({ toUserId: 1, readAt: 1 });

export default mongoose.model('Message', messageSchema);