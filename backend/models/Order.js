import crypto from 'crypto';
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  product_name: {
    type: String,
    required: true,
  },
  product_image: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be positive'],
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal must be positive'],
  },
});

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  accuracy: { type: Number, default: null, min: 0 },
  recorded_at: { type: Date, default: Date.now },
  note: { type: String, default: '', maxlength: 300 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  idempotency_key: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  tracking_token: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(18).toString('hex'),
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (items) => items && items.length > 0,
      message: 'Order must have at least one item',
    },
  },
  total_amount: { type: Number, required: true, min: [0, 'Total amount must be positive'] },
  shipping_fee: { type: Number, default: 0, min: [0, 'Shipping fee must be positive'] },
  tax_amount: { type: Number, default: 0, min: [0, 'Tax amount must be positive'] },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  delivery_status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
    default: 'pending',
    index: true,
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  payment_method: { type: String, enum: ['mpesa', 'card', 'cash'], default: 'mpesa' },
  payment_phone: { type: String, default: '' },
  payment_transaction_id: { type: String, default: '' },
  payment_request_id: { type: String, default: '' },
  shipping_address: { type: String, default: '' },
  shipping_city: { type: String, default: '' },
  shipping_country: { type: String, default: 'Kenya' },
  pickup_address: { type: String, default: '' },
  latitude: { type: Number, default: null, min: -90, max: 90 },
  longitude: { type: Number, default: null, min: -180, max: 180 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [] },
  },
  delivery_agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  estimated_delivery_at: { type: Date, default: null },
  location_history: { type: [locationSchema], default: [] },
  notes: { type: String, default: '', maxlength: [500, 'Notes cannot exceed 500 characters'] },
  status_history: [{
    status: { type: String, required: true },
    updated_at: { type: Date, default: Date.now },
    updated_by: { type: String, default: 'system' },
  }],
  delivered_at: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, delivery_status: 1, updatedAt: -1 });
orderSchema.index({ delivery_agent: 1, delivery_status: 1 });
orderSchema.index({ 'location.coordinates': '2dsphere' });
orderSchema.index({ payment_request_id: 1 }, { sparse: true });

orderSchema.pre('save', async function(next) {
  if (this.order_number) return next();
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  this.order_number = `HK${stamp}-${crypto.randomInt(100000, 999999)}`;
  next();
});

orderSchema.methods.updateStatus = async function(newStatus, updatedBy = 'system') {
  this.status = newStatus;
  this.status_history.push({ status: newStatus, updated_by: updatedBy });
  if (newStatus === 'delivered') {
    this.delivered_at = new Date();
    this.delivery_status = 'delivered';
  }
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
