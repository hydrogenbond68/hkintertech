import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  user_name: {
    type: String,
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  product_name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'replied', 'resolved'],
      message: 'Status must be one of: pending, replied, resolved'
    },
    default: 'pending',
    index: true
  },
  reply: {
    type: String,
    default: '',
    trim: true
  },
  replied_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

inquirySchema.index({ user: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;