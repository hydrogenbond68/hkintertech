import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.find({ user: req.user._id }).populate('product').sort({ createdAt: -1 }).lean();
  res.json({ wishlist });
});

export const addWishlistItem = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const item = await Wishlist.findOneAndUpdate(
    { user: req.user._id, product: product._id },
    { user: req.user._id, product: product._id },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.status(201).json({ wishlist: item });
});

export const removeWishlistItem = asyncHandler(async (req, res) => {
  await Wishlist.deleteOne({ user: req.user._id, product: req.params.productId });
  res.json({ message: 'Removed from wishlist' });
});
