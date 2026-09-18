import Order from '../models/Order.js';
import { recordPayment } from './orderService.js';

let accessToken;
let accessTokenExpiresAt = 0;

const isProduction = process.env.MPESA_ENV === 'production';
const baseUrl = () => isProduction
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

const requireCredentials = () => {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    const error = new Error('M-Pesa credentials are not configured');
    error.statusCode = 503;
    throw error;
  }
  return { shortcode, passkey };
};

const getAccessToken = async () => {
  if (accessToken && Date.now() < accessTokenExpiresAt) return accessToken;
  const { shortcode, passkey } = requireCredentials();
  const response = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${shortcode}:${passkey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const error = new Error(data.errorDescription || 'Unable to obtain M-Pesa access token');
    error.statusCode = 502;
    throw error;
  }
  accessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + ((data.expires_in || 3500) * 800);
  return accessToken;
};

const normalizePhone = (phone) => {
  const value = String(phone || '').replace(/\s/g, '');
  if (/^254\d{9}$/.test(value)) return value;
  if (/^0\d{9}$/.test(value)) return `254${value.slice(1)}`;
  const error = new Error('A valid M-Pesa phone number is required');
  error.statusCode = 400;
  throw error;
};

const timestamp = () => new Date().toISOString().replace(/[-:T]|\.\d{3}Z/g, '');

export const requestStkPush = async ({ order, phone, amount }) => {
  const { shortcode, passkey } = requireCredentials();
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!callbackUrl) {
    const error = new Error('MPESA_CALLBACK_URL is not configured');
    error.statusCode = 503;
    throw error;
  }
  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
  const response = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(Number(amount || order.total_amount)),
      PartyA: normalizePhone(phone),
      PartyB: shortcode,
      PhoneNumber: normalizePhone(phone),
      CallBackURL: callbackUrl,
      AccountReference: order.order_number,
      TransactionDesc: `Harykims Intertech order ${order.order_number}`,
    }),
  });
  const data = await response.json();
  if (!response.ok || data.ResponseCode !== '0') {
    const error = new Error(data.errorMessage || data.ResponseDescription || 'M-Pesa STK request failed');
    error.statusCode = 502;
    throw error;
  }
  const updated = await Order.findByIdAndUpdate(order._id, {
    payment_request_id: data.CheckoutRequestID,
    payment_phone: normalizePhone(phone),
  }, { new: true });
  return { checkout_request_id: data.CheckoutRequestID, merchant_request_id: data.MerchantRequestID, order: updated };
};

export const handleStkCallback = async (body) => {
  const checkoutRequestId = body.CheckoutRequestID || body.checkout_request_id;
  if (!checkoutRequestId) return { ResultCode: '400', ResultDesc: 'CheckoutRequestID is required' };
  const order = await Order.findOne({ payment_request_id: checkoutRequestId });
  if (!order) return { ResultCode: '404', ResultDesc: 'Order not found' };

  const resultCode = String(body.ResultCode || body.result_code || '');
  const completed = resultCode === '0';
  const transactionId = body.MpesaReceiptNumber || body.mpesa_receipt_number || '';
  await recordPayment({
    orderId: order._id,
    paymentStatus: completed ? 'completed' : 'failed',
    transactionId,
    requestId: checkoutRequestId,
  });
  return { ResultCode: '0', ResultDesc: 'Callback accepted' };
};

export const queryStkStatus = async ({ order }) => {
  if (!order.payment_request_id) return { status: order.payment_status };
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl()}/mpesa/stkpush/query/v1`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp()}`).toString('base64'),
      Timestamp: timestamp(),
      CheckoutRequestID: order.payment_request_id,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.errorMessage || 'Unable to query M-Pesa payment');
    error.statusCode = 502;
    throw error;
  }
  return data;
};
