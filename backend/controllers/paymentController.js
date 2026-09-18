import Order from '../models/Order.js';
import { requestStkPush, handleStkCallback, queryStkStatus } from '../services/mpesaService.js';

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const createStkPush = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.body.order_id || req.body.orderId,
    ...(req.user.is_admin ? {} : { user: req.user._id }),
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const result = await requestStkPush({
    order,
    phone: req.body.phone || req.body.payment_phone || order.payment_phone,
    amount: req.body.amount || order.total_amount,
  });
  res.json(result);
});

export const stkCallback = asyncHandler(async (req, res) => {
  const result = await handleStkCallback(req.body);
  res.json(result);
});

export const getStkStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    ...(req.user.is_admin ? {} : { user: req.user._id }),
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const result = await queryStkStatus({ order });
  res.json({ order_id: order._id, payment_status: order.payment_status, mpesa: result });
});
