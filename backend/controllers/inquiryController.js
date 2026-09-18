import Inquiry from '../models/Inquiry.js';
import Product from '../models/Product.js';

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const createInquiry = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.body.product_id || req.body.product).select('name');
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const inquiry = await Inquiry.create({
    user: req.user._id,
    user_name: `${req.user.first_name} ${req.user.last_name}`.trim(),
    user_email: req.body.user_email || req.user.email,
    product: product._id,
    product_name: product.name,
    subject: req.body.subject,
    message: req.body.message,
  });
  res.status(201).json({ inquiry });
});

export const getUserInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ inquiries });
});

export const getAllInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({}).sort({ createdAt: -1 }).lean();
  res.json({ inquiries });
});

export const replyToInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, {
    reply: req.body.reply,
    status: 'replied',
    replied_at: new Date(),
  }, { new: true });
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
  res.json({ inquiry });
});
