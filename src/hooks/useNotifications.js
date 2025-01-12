import { useState, useEffect } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3101');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'initial') {
        setNotifications(data.notifications);
      } else if (data.type === 'new') {
        setNotifications(prev => [data.notification, ...prev]);
      }
    };

    ws.onopen = () => {
      console.log('Connected to notification server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  return notifications;
}