import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { getWebSocketUrl } from '../utils/websocket';

const WebSocketContext = createContext({
  isConnected: false,
  lastNotification: null,
});

export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const backoffRef = useRef(1000);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      try {
        const wsUrl = getWebSocketUrl('/ws/notifications/', { token });
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          backoffRef.current = 1000; // Reset backoff on successful connection
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setLastNotification(data);

            // Display toast notification
            toast(
              `${data.title || 'Notification'}: ${data.message || ''}`,
              {
                icon: '🔔',
                duration: 4000,
              }
            );

            // Update notifications cache immediately
            queryClient.setQueryData(['notifications'], (oldData) => {
              if (!oldData) return [data];
              if (Array.isArray(oldData)) {
                return [data, ...oldData.filter((item) => item.id !== data.id)];
              }
              const results = oldData.results || [];
              return {
                ...oldData,
                count: (oldData.count || results.length) + 1,
                results: [data, ...results.filter((item) => item.id !== data.id)],
              };
            });

            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          } catch (err) {
            console.error('Error parsing notification WebSocket payload:', err);
          }
        };

        ws.onclose = (event) => {
          if (!isMounted) return;
          setIsConnected(false);
          wsRef.current = null;

          // Reconnect with exponential backoff if not normal close
          if (event.code !== 1000 && isAuthenticated) {
            const delay = backoffRef.current;
            backoffRef.current = Math.min(delay * 1.5, 15000);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token, queryClient]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastNotification }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
