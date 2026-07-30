import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚡ Socket disconnected');
    });

    socket.on('new-emails', (data) => {
      setLastEvent({ type: 'new-emails', data, timestamp: Date.now() });
    });

    socket.on('status-update', (data) => {
      setLastEvent({ type: 'status-update', data, timestamp: Date.now() });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, isConnected, lastEvent };
}
