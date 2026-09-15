import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  product_image: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be positive']
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal must be positive']
  }
});

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  total_amount: {
    type: Number,
    required: true,
    min: [0, 'Total amount must be positive']
  },
  shipping_fee: {
    type: Number,
    default: 0,
    min: [0, 'Shipping fee must be positive']
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount must be positive']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      message: 'Status must be one of: pending, processing, shipped, delivered, cancelled'
    },
    default: 'pending',
    index: true
  },
  payment_status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'failed', 'refunded'],
      message: 'Payment status must be one of: pending, completed, failed, refunded'
    },
    default: 'pending',
    index: true
  },
  payment_method: {
    type: String,
    enum: ['mpesa', 'card', 'cash'],
    default: 'mpesa'
  },
  payment_phone: {
    type: String,
    default: ''
  },
  shipping_address: {
    type: String,
    default: ''
  },
  shipping_city: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: '',
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status_history: [{
    status: {
      type: String,
      required: true
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    updated_by: {
      type: String,
      default: 'system'
    }
  }],
  delivered_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for common queries
orderSchema.index({ user: 1, created_at: -1 });
orderSchema.index({ status: 1, created_at: -1 });
orderSchema.index({ created_at: -1 });

// Pre-save hook to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.order_number) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.order_number = `HK${year}${month}${day}-${random}`;
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, updatedBy = 'system') {
  this.status = newStatus;
  this.status_history.push({
    status: newStatus,
    updated_by: updatedBy
  });
  
  if (newStatus === 'delivered') {
    this.delivered_at = new Date();
  }
  
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

export default Order;