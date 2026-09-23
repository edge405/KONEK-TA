import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getWebSocketUrl } from '../utils/websocket';

export function useGroupChatSocket(groupId) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !groupId) {
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
        const wsUrl = getWebSocketUrl(`/ws/groups/${groupId}/chat/`, { token });
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

            if (data && data.id && data.content) {
              queryClient.setQueryData(['groupChat', groupId], (oldData) => {
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
            }
          } catch (err) {
            console.error('Failed to parse incoming group chat WebSocket message:', err);
          }
        };

        ws.onclose = (event) => {
          if (!isMounted) return;
          setIsSocketConnected(false);
          wsRef.current = null;

          // 4001: not authenticated, 4003: not member - do not reconnect
          if (event.code !== 1000 && event.code !== 4001 && event.code !== 4003 && isAuthenticated) {
            reconnectTimeoutRef.current = setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('Error connecting group chat WebSocket:', err);
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
  }, [groupId, token, isAuthenticated, queryClient]);

  const sendSocketMessage = useCallback((content) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
      return true;
    }
    return false;
  }, []);

  return {
    isSocketConnected,
    sendSocketMessage,
  };
}
