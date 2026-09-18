import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * useRealtimeOrders
 * Subscribes to Socket.IO order events and merges new/updated orders into
 * a local list without requiring a page refresh. Falls back gracefully when
 * the socket is unavailable.
 */
export const useRealtimeOrders = (initialOrders = []) => {
  const [orders, setOrders] = useState(initialOrders);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const { isConnected, on } = useSocket();
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
      if (!order || !order.id) return;
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) {
          return prev.map((o) => (o.id === order.id ? { ...o, ...order } : o));
        }
        return [order, ...prev];
      });
    };

    const removeOrder = (id) => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    };

    const offNew = on('order:new', upsertOrder);
    const offUpdated = on('order:updated', upsertOrder);
    const offCreated = on('order:created', upsertOrder);
    const offStatus = on('order:status_changed', upsertOrder);
    const offDeleted = on('order:deleted', removeOrder);

    return () => {
      if (offNew) offNew();
      if (offUpdated) offUpdated();
      if (offCreated) offCreated();
      if (offStatus) offStatus();
      if (offDeleted) offDeleted();
    };
  }, [on]);

  return { orders, setOrders, realtimeConnected };
};

export default useRealtimeOrders;