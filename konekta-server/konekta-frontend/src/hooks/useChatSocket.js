import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getWebSocketUrl } from '../utils/websocket';

export function useChatSocket(conversationId) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !conversationId) {
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
      setIsSocketConnected(false);
      return;
    }

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      try {
        const wsUrl = getWebSocketUrl(`/ws/chat/${conversationId}/`, { token });
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsSocketConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'read_receipt') {
              // Update read status for messages in this conversation
              queryClient.setQueryData(['messages', conversationId], (oldData) => {
                if (!oldData) return oldData;
                const updateList = (list) =>
                  list.map((msg) => ({ ...msg, is_read: true }));

                if (Array.isArray(oldData)) {
                  return updateList(oldData);
                }
                return {
                  ...oldData,
                  results: updateList(oldData.results || []),
                };
              });
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
              return;
            }

            // Normal message received
            if (data.id && data.content) {
              queryClient.setQueryData(['messages', conversationId], (oldData) => {
                if (!oldData) return [data];
                if (Array.isArray(oldData)) {
                  if (oldData.some((m) => m.id === data.id)) return oldData;
                  return [...oldData, data];
                }
                const results = oldData.results || [];
                if (results.some((m) => m.id === data.id)) return oldData;
                return {
                  ...oldData,
                  count: (oldData.count || results.length) + 1,
                  results: [...results, data],
                };
              });

              // Refresh conversation list to update last_message and ordering
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
          } catch (err) {
            console.error('Failed to parse incoming chat WebSocket message:', err);
          }
        };

        ws.onclose = (event) => {
          if (!isMounted) return;
          setIsSocketConnected(false);
          wsRef.current = null;

          if (event.code !== 1000 && isAuthenticated) {
            reconnectTimeoutRef.current = setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('Error connecting chat WebSocket:', err);
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
  }, [conversationId, token, isAuthenticated, queryClient]);

  const sendSocketMessage = useCallback((content) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
      return true;
    }
    return false;
  }, []);

  const markSocketRead = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'mark_read' }));
      return true;
    }
    return false;
  }, []);

  return {
    isSocketConnected,
    sendSocketMessage,
    markSocketRead,
  };
}
