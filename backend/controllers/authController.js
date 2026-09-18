import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../config/email.js';

const tokenFor = (user) => jwt.sign(
  { id: user._id.toString(), email: user.email, is_admin: Boolean(user.is_admin) },
  process.env.JWT_SECRET || 'default-secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

const publicUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  company_name: user.company_name,
  phone: user.phone,
  address: user.address,
  profile_image: user.profile_image,
  is_admin: Boolean(user.is_admin),
  is_verified: Boolean(user.is_verified),
  is_active: Boolean(user.is_active),
  created_at: user.createdAt,
});

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const register = asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, company_name, phone, address } = req.body;
  const existing = await User.findOne({ email: (email || '').trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account already exists for this email' });
  }

  const user = await User.create({
    email: (email || '').trim().toLowerCase(),
    password,
    first_name,
    last_name,
    company_name,
    phone,
    address,
  });

  res.status(201).json({ user: publicUser(user), access_token: tokenFor(user) });
});

export const login = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password || ''))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }
  res.json({ user: publicUser(user), access_token: tokenFor(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['first_name', 'last_name', 'company_name', 'phone', 'address', 'profile_image'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  });
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Harykims Intertech password reset',
      text: `Reset your password using this link: ${resetUrl}`,
      html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    }).catch(() => {
      user.password_reset_token = null;
      user.password_reset_expires = null;
      return user.save({ validateBeforeSave: false });
    });
  }
  res.json({ message: 'If an account exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
  const user = await User.findOne({
    password_reset_token: hashedToken,
    password_reset_expires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

  user.password = req.body.new_password || req.body.password;
  user.password_reset_token = null;
  user.password_reset_expires = null;
  user.password_changed_at = new Date();
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.is_admin = Boolean(req.body.is_admin);
  await user.save();
  res.json({ user: publicUser(user) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  await User.deleteOne({ _id: user._id });
  res.json({ message: 'User deleted' });
});
