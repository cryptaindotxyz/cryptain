import { WebSocketServer } from 'ws';
import { WEBSOCKET_PORT } from '../config/constants.js';

class WebSocketService {
  constructor() {
    this.wss = new WebSocketServer({ port: WEBSOCKET_PORT });
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  async handleConnection(ws) {
    console.log('Client connected');
    
    try {
      const notifications = await this.getInitialNotifications();
      ws.send(JSON.stringify({ type: 'initial', notifications }));
    } catch (error) {
      console.error('Error sending initial notifications:', error);
    }
    
    ws.on('close', () => console.log('Client disconnected'));
  }

  broadcast(data) {
    this.wss.clients.forEach(client => {
      client.send(JSON.stringify(data));
    });
  }

  // This will be set by the main server
  getInitialNotifications = async () => [];
}

export const wsService = new WebSocketService();