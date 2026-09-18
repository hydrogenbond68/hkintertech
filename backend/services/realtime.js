import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getRedis } from './cache.js';

let io;
let socketServer;

const publicUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  is_admin: Boolean(user.is_admin),
});

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.is_active) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
};

export const createRealtimeServer = (httpServer) => {
  if (socketServer) return socketServer;

  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  socketServer = new Server(httpServer, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    maxHttpBufferSize: 1e6,
  });

  socketServer.use(authenticateSocket);

  const attachRedis = async () => {
    const client = await getRedis();
    if (!client) return;
    try {
      const pubClient = client.duplicate();
      const subClient = client.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      socketServer.adapter(createAdapter(pubClient, subClient));
    } catch (error) {
      console.error('Socket.IO Redis adapter unavailable:', error.message);
    }
  };

  attachRedis();

  socketServer.on('connection', (socket) => {
    if (socket.user?.is_admin) {
      socket.join('admins');
    }
    if (socket.user) {
      socket.join(`user:${socket.user._id.toString()}`);
    }

    socket.on('orders:join', ({ orderIds = [] } = {}) => {
      if (!socket.user) return;
      orderIds.forEach((id) => socket.join(`order:${String(id)}`));
    });
  });

  return socketServer;
};

export const emitOrderEvent = (event, order) => {
  if (!socketServer) return;
  const payload = order.toObject ? order.toObject({ versionKey: false }) : order;
  const orderId = payload._id || payload.id;
  const userId = payload.user?._id || payload.user || payload.user_id;
  socketServer.to('admins').emit(event, payload);
  if (orderId) {
    socketServer.to(`order:${String(orderId)}`).emit(event, payload);
  }
  if (userId) {
    socketServer.to(`user:${String(userId)}`).emit(event, payload);
  }
};

export const emitOrderLocation = (order) => {
  emitOrderEvent('order:location', order);
};

export const closeRealtimeServer = async () => {
  if (socketServer) {
    socketServer.disconnectSockets(true);
    await socketServer.close();
    socketServer = null;
  }
};

export default createRealtimeServer;
