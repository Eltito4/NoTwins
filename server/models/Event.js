import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  creatorId: { 
    type: String, 
    required: true 
  },
  participants: [{ 
    type: String 
  }],
  dresses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Dress' 
  }],
  shareId: { 
    type: String, 
    unique: true, 
    required: true 
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

export default mongoose.model('Event', eventSchema);