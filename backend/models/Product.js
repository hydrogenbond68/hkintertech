import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  sub_category: {
    type: String,
    trim: true,
    default: ''
  },
  stock_quantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity must be positive'],
    default: 0
  },
  min_order_quantity: {
    type: Number,
    required: [true, 'Minimum order quantity is required'],
    min: [1, 'Minimum order quantity must be at least 1'],
    default: 1
  },
  image_urls: {
    type: [String],
    default: []
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  average_rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating must be at most 5']
  },
  total_reviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews must be positive']
  },
  tags: {
    type: [String],
    default: [],
    index: true
  }
}, {
  timestamps: true
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

// Compound index for category-based queries
productSchema.index({ category: 1, is_active: 1, createdAt: -1 });
productSchema.index({ is_featured: 1, createdAt: -1 });
productSchema.index({ average_rating: -1, total_reviews: -1 });
productSchema.index({ price: 1, is_active: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;