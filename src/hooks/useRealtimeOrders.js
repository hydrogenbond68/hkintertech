import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

const orderIdOf = (order) => order?.id || order?._id || order?.order_id || null;

/**
 * useRealtimeOrders
 * Subscribes to Socket.IO order events and merges new/updated orders into
 * a local list without requiring a page refresh. Falls back gracefully when
 * the socket is unavailable.
 */
export const useRealtimeOrders = (initialOrders = []) => {
  const [orders, setOrders] = useState(initialOrders);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const { isConnected, on, emit } = useSocket();
  const ordersRef = useRef(orders);

  // Keep ref in sync so event handlers always see the latest state.
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setRealtimeConnected(isConnected);
  }, [isConnected]);

  useEffect(() => {
    const upsertOrder = (order) => {
      const id = orderIdOf(order);
      if (!id) return;
      setOrders((prev) => {
        const exists = prev.some((o) => orderIdOf(o) === id);
        if (exists) {
          return prev.map((o) => (orderIdOf(o) === id ? { ...o, ...order, id } : o));
        }
        return [{ ...order, id }, ...prev];
      });
    };

    const removeOrder = (id) => {
      setOrders((prev) => prev.filter((o) => orderIdOf(o) !== id));
    };

    const offNew = on('order:new', upsertOrder);
    const offUpdated = on('order:updated', upsertOrder);
    const offCreated = on('order:created', upsertOrder);
    const offStatus = on('order:status_changed', upsertOrder);
    const offLocation = on('order:location', upsertOrder);
    const offDeleted = on('order:deleted', removeOrder);

    return () => {
      if (offNew) offNew();
      if (offUpdated) offUpdated();
      if (offCreated) offCreated();
      if (offStatus) offStatus();
      if (offLocation) offLocation();
      if (offDeleted) offDeleted();
    };
  }, [on]);

  // Join the per-order rooms. The server only emits to `order:<id>` when the
  // socket has joined that room, so without this every order event is dropped.
  useEffect(() => {
    if (!isConnected) return;
    const orderIds = ordersRef.current.map(orderIdOf).filter(Boolean);
    if (orderIds.length > 0) {
      emit('orders:join', { orderIds });
    }
  }, [isConnected, emit, orders]);

  return { orders, setOrders, realtimeConnected };
};

export default useRealtimeOrders;