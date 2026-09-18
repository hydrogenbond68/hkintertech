import crypto from 'crypto';
import Order from '../models/Order.js';
import {
  createOrder as createOrderInDatabase,
  listOrders,
  findOrder,
  updateOrderStatus as changeOrderStatus,
  updateOrderLocation,
  assignDeliveryAgent,
  recordPayment,
} from '../services/orderService.js';

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const createOrder = asyncHandler(async (req, res) => {
  const idempotencyKey = req.body.idempotency_key || req.body.idempotencyKey || crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex').slice(0, 48);
  const { order, created } = await createOrderInDatabase({ user: req.user, body: { ...req.body, idempotency_key: idempotencyKey } });
  res.status(created ? 201 : 200).json({ order });
});

export const getOrders = asyncHandler(async (req, res) => {
  const result = await listOrders({ user: req.user, query: req.query });
  res.json(result);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await findOrder({ user: req.user, id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await changeOrderStatus({
    user: req.user,
    id: req.params.id,
    status: req.body.status,
    deliveryStatus: req.body.delivery_status || req.body.deliveryStatus,
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const order = await updateOrderLocation({
    user: req.user,
    id: req.params.id,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    accuracy: req.body.accuracy,
    note: req.body.note,
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

export const assignAgent = asyncHandler(async (req, res) => {
  const order = await assignDeliveryAgent({ id: req.params.id, agentId: req.body.agent_id || req.body.delivery_agent });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await findOrder({ user: req.user, id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order: { id: order._id, order_number: order.order_number, payment_status: order.payment_status, payment_transaction_id: order.payment_transaction_id } });
});

export const markPayment = asyncHandler(async (req, res) => {
  const order = await recordPayment({
    orderId: req.params.id,
    paymentStatus: req.body.payment_status,
    transactionId: req.body.transaction_id,
    requestId: req.body.request_id,
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});
