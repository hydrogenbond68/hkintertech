import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, is_active: true }).sort({ createdAt: -1 }).lean();
  res.json({ reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.product_id || req.body.product)) {
    return res.status(400).json({ error: 'Valid product id is required' });
  }
  const existing = await Review.findOne({ user: req.user._id, product: req.body.product_id || req.body.product });
  if (existing) return res.status(409).json({ error: 'You have already reviewed this product' });
  const purchased = await Order.exists({
    user: req.user._id,
    'items.product': req.body.product_id || req.body.product,
    payment_status: 'completed',
  });
  const review = await Review.create({
    user: req.user._id,
    user_name: `${req.user.first_name} ${req.user.last_name}`.trim(),
    product: req.body.product_id || req.body.product,
    rating: Number(req.body.rating),
    comment: req.body.comment,
    is_verified_purchase: Boolean(purchased),
  });
  res.status(201).json({ review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (!req.user.is_admin) filter.user = req.user._id;
  const review = await Review.findOneAndDelete(filter);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json({ message: 'Review deleted' });
});

export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({}).sort({ createdAt: -1 }).lean();
  res.json({ reviews });
});
