import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import User from '../models/User.js';
import { getRedis } from './cache.js';
import { resolveAllowedOrigins, createOriginChecker } from '../config/cors.js';
import { verifyToken } from '../config/jwt.js';

let socketServer;
let attachTimer;

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    const decoded = verifyToken(token);
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

  const allowedOrigins = resolveAllowedOrigins();

  socketServer = new Server(httpServer, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    cors: {
      origin: createOriginChecker(allowedOrigins),
      credentials: true,
    },
    maxHttpBufferSize: 1e6,
  });

  socketServer.use(authenticateSocket);

  // The Redis adapter is what lets order events reach clients connected to a
  // different instance. Attach it whenever Redis becomes reachable, not just
  // once at boot, otherwise a boot-time outage leaves multi-instance fan-out
  // silently broken for the rest of the process lifetime.
  let attached = false;
  const attachRedis = async () => {
    if (attached || !socketServer) return;
    const client = await getRedis();
    if (!client) return;

    try {
      const pubClient = client.duplicate();
      const subClient = client.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      socketServer.adapter(createAdapter(pubClient, subClient));
      attached = true;
      console.log('Socket.IO Redis adapter attached (cross-instance events enabled)');
    } catch (error) {
      console.error('Socket.IO Redis adapter unavailable:', error.message);
    }
  };

  attachRedis();
  attachTimer = setInterval(attachRedis, 10000);
  attachTimer.unref?.();

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
  // Serialize through toJSON so the schema's `virtuals: true` transform emits
  // `id` alongside `_id`. A raw toObject() call drops the virtual, and clients
  // keying their state on `id` would silently discard every event.
  const payload = order.toJSON ? order.toJSON({ versionKey: false }) : order;
  const orderId = payload.id || payload._id;
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
  if (attachTimer) {
    clearInterval(attachTimer);
    attachTimer = undefined;
  }
  if (socketServer) {
    socketServer.disconnectSockets(true);
    await socketServer.close();
    socketServer = null;
  }
};

export default createRealtimeServer;
