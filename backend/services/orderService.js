import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { invalidateCatalog } from './cache.js';
import { emitOrderEvent } from './realtime.js';

const allowedStatuses = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
const allowedDeliveryStatuses = new Set(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed']);

const asObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const runTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const createOrder = async ({ user, body }) => {
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length) {
    const error = new Error('Cart must contain at least one item');
    error.statusCode = 400;
    throw error;
  }

  const normalizedItems = rawItems.map((item) => ({
    product: asObjectId(item.product || item.product_id || item.id),
    quantity: Number(item.quantity || 1),
  }));
  if (normalizedItems.some((item) => !item.product || !Number.isFinite(item.quantity) || item.quantity < 1)) {
    const error = new Error('Each order item requires a valid product and quantity');
    error.statusCode = 400;
    throw error;
  }

  const idempotencyKey = body.idempotency_key || body.idempotencyKey || `user:${user._id}:${Date.now()}`;
  const existing = await Order.findOne({ idempotency_key: idempotencyKey, user: user._id });
  if (existing) return { order: existing, created: false };

  const result = await runTransaction(async (session) => {
    const products = await Product.find({ _id: { $in: normalizedItems.map((item) => item.product) } }).session(session);
    const byId = new Map(products.map((product) => [product._id.toString(), product]));
    const orderItems = [];

    for (const item of normalizedItems) {
      const product = byId.get(item.product.toString());
      if (!product || !product.is_active) {
        const error = new Error(`Product ${item.product} is unavailable`);
        error.statusCode = 409;
        throw error;
      }
      if (item.quantity < product.min_order_quantity) {
        const error = new Error(`${product.name} requires a minimum order quantity of ${product.min_order_quantity}`);
        error.statusCode = 400;
        throw error;
      }
      if (product.stock_quantity < item.quantity) {
        const error = new Error(`${product.name} has insufficient stock`);
        error.statusCode = 409;
        throw error;
      }
      const updated = await Product.updateOne(
        { _id: item.product, is_active: true, stock_quantity: { $gte: item.quantity } },
        { $inc: { stock_quantity: -item.quantity } },
        { session },
      );
      if (updated.matchedCount !== 1) {
        const error = new Error(`${product.name} stock changed while checkout was running`);
        error.statusCode = 409;
        throw error;
      }
      orderItems.push({
        product: product._id,
        product_name: product.name,
        product_image: Array.isArray(product.image_urls) ? product.image_urls[0] || '' : '',
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = Number(body.shipping_fee || 0);
    const taxAmount = Number(body.tax_amount || 0);
    const order = await Order.create([{
      user: user._id,
      user_name: body.user_name || `${user.first_name} ${user.last_name}`.trim(),
      user_email: body.user_email || user.email,
      items: orderItems,
      total_amount: subtotal + shippingFee + taxAmount,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      payment_method: body.payment_method || 'mpesa',
      payment_phone: body.payment_phone || body.phone || user.phone || '',
      shipping_address: body.shipping_address || body.address || user.address || '',
      shipping_city: body.shipping_city || body.city || '',
      shipping_country: body.shipping_country || 'Kenya',
      pickup_address: body.pickup_address || '',
      notes: body.notes || '',
      idempotency_key: idempotencyKey,
      status_history: [{ status: 'pending', updated_by: 'system' }],
    }], { session });
    return order[0];
  });

  await invalidateCatalog();
  emitOrderEvent('order:created', result);
  emitOrderEvent('order:new', result);
  return { order: result, created: true };
};

export const listOrders = async ({ user, query = {} }) => {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1);
  const perPage = Math.min(100, Math.max(1, Number.parseInt(query.per_page || '20', 10) || 20));
  const filter = {};
  if (!user.is_admin) filter.user = user._id;
  if (query.status) filter.status = query.status;
  if (query.delivery_status) filter.delivery_status = query.delivery_status;
  if (query.payment_status) filter.payment_status = query.payment_status;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage),
    Order.countDocuments(filter),
  ]);
  return { orders, pagination: { page, per_page: perPage, total, pages: Math.max(1, Math.ceil(total / perPage)) } };
};

export const findOrder = async ({ user, id }) => {
  const filter = { _id: id };
  if (!user.is_admin) filter.user = user._id;
  const order = await Order.findOne(filter);
  return order;
};

export const updateOrderStatus = async ({ user, id, status, deliveryStatus }) => {
  if (!allowedStatuses.has(status)) {
    const error = new Error('Invalid order status');
    error.statusCode = 400;
    throw error;
  }
  const order = await Order.findOneAndUpdate(
    { _id: id, ...(user.is_admin ? {} : { user: user._id }) },
    {
      $set: {
        status,
        ...(deliveryStatus && allowedDeliveryStatuses.has(deliveryStatus) ? { delivery_status: deliveryStatus } : {}),
      },
      $push: { status_history: { status, updated_by: user._id.toString() } },
      ...(status === 'delivered' ? { $set: { delivered_at: new Date(), delivery_status: 'delivered' } } : {}),
    },
    { new: true },
  );
  if (!order) return null;
  emitOrderEvent('order:updated', order);
  emitOrderEvent('order:status_changed', order);
  return order;
};

export const updateOrderLocation = async ({ user, id, latitude, longitude, accuracy, note }) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    const error = new Error('Invalid latitude or longitude');
    error.statusCode = 400;
    throw error;
  }
  const order = await Order.findOneAndUpdate(
    { _id: id, ...(user.is_admin ? {} : { user: user._id }) },
    {
      $set: {
        latitude: lat,
        longitude: lng,
        location: { type: 'Point', coordinates: [lng, lat] },
      },
      $push: {
        location_history: {
          latitude: lat,
          longitude: lng,
          accuracy: Number.isFinite(Number(accuracy)) ? Number(accuracy) : null,
          note: note || '',
        },
      },
    },
    { new: true },
  );
  if (!order) return null;
  emitOrderLocation(order);
  return order;
};

export const assignDeliveryAgent = async ({ id, agentId }) => {
  const agent = asObjectId(agentId);
  if (!agent) {
    const error = new Error('Invalid delivery agent');
    error.statusCode = 400;
    throw error;
  }
  const order = await Order.findOneAndUpdate(
    { _id: id, delivery_status: { $in: ['pending', 'assigned'] } },
    { $set: { delivery_agent: agent, delivery_status: 'assigned' } },
    { new: true },
  );
  if (!order) return null;
  emitOrderEvent('order:updated', order);
  return order;
};

export const recordPayment = async ({ orderId, paymentStatus, transactionId, requestId }) => {
  if (!['completed', 'failed', 'refunded'].includes(paymentStatus)) return null;
  const order = await Order.findOneAndUpdate(
    { _id: orderId, payment_status: { $ne: paymentStatus } },
    {
      $set: {
        payment_status: paymentStatus,
        ...(transactionId ? { payment_transaction_id: transactionId } : {}),
        ...(requestId ? { payment_request_id: requestId } : {}),
        ...(paymentStatus === 'completed' ? { status: 'processing', delivery_status: 'pending' } : {}),
      },
      $push: { status_history: { status: paymentStatus === 'completed' ? 'processing' : 'cancelled', updated_by: 'payment-gateway' } },
    },
    { new: true },
  );
  if (order) {
    emitOrderEvent('order:updated', order);
    emitOrderEvent('order:status_changed', order);
  }
  return order;
};
