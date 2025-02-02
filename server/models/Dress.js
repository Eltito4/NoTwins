import mongoose from 'mongoose';

const dressSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    trim: true
  },
  color: { 
    type: String,
    trim: true
  },
  brand: { 
    type: String,
    trim: true
  },
  price: { 
    type: Number 
  },
  type: {
    category: String,
    subcategory: String,
    name: String
  },
  isPrivate: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
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

// Add index for efficient queries
dressSchema.index({ eventId: 1, name: 1 });

export default mongoose.model('Dress', dressSchema);