import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for messages
interface TestEvent {
  event: string;
  timestamp: string;
  element: {
    tag: string;
    text?: string;
    id?: string;
    class?: string;
    'data-testid'?: string;
    xpath?: string;
    cssSelector?: string;
  };
  page: {
    url: string;
    title: string;
  };
  value?: string;
  sessionId: string;
}

interface ClientMessage {
  type: 'register' | 'event' | 'session-start' | 'session-end';
  clientType: 'chrome-extension' | 'vscode-extension';
  data?: any;
  sessionId?: string;
  url?: string;
  autoLaunch?: boolean;
}

interface RegisteredClient {
  id: string;
  type: 'chrome-extension' | 'vscode-extension';
  ws: WebSocket;
  sessionId?: string;
}

class TestCaptiveBridge {
  private server: WebSocketServer;
  private clients: Map<string, RegisteredClient> = new Map();
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.server = new WebSocketServer({ port });
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.server.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      console.log(`New connection established: ${clientId}`);

      ws.on('message', (data: Buffer) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    this.server.on('listening', () => {
      console.log(`TestCaptive Bridge Server listening on port ${this.port}`);
      console.log(`WebSocket URL: ws://localhost:${this.port}`);
    });
  }

  private handleMessage(clientId: string, ws: WebSocket, message: ClientMessage): void {
    switch (message.type) {
      case 'register':
        this.registerClient(clientId, ws, message);
        break;
      case 'session-start':
        this.handleSessionStart(clientId, message);
        break;
      case 'session-end':
        this.handleSessionEnd(clientId, message);
        break;
      case 'event':
        this.broadcastEvent(clientId, message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private registerClient(clientId: string, ws: WebSocket, message: ClientMessage): void {
    const client: RegisteredClient = {
      id: clientId,
      type: message.clientType,
      ws: ws,
      sessionId: message.sessionId
    };

    this.clients.set(clientId, client);
    console.log(`Registered ${message.clientType} client: ${clientId}`);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'registration-success',
      clientId: clientId,
      timestamp: new Date().toISOString()
    }));

    // Notify other clients about new connection
    this.broadcastToOtherClients(clientId, {
      type: 'client-connected',
      clientType: message.clientType,
      clientId: clientId
    });
  }
  private handleSessionStart(clientId: string, message: ClientMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.sessionId = message.sessionId;
      console.log(`Session started: ${message.sessionId} for client ${clientId}`);
      
      // First, forward the original session-start message to other clients (especially Chrome extension)
      this.broadcastToOtherClients(clientId, {
        ...message,
        timestamp: new Date().toISOString(),
        initiatedBy: client.type
      });
      
      // Then, broadcast session-started confirmation to all clients
      this.broadcastToAllClients({
        type: 'session-started',
        sessionId: message.sessionId,
        timestamp: new Date().toISOString(),
        initiatedBy: client.type
      });
    }
  }

  private handleSessionEnd(clientId: string, message: ClientMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`Session ended: ${message.sessionId} for client ${clientId}`);
      
      // Broadcast session end to all clients
      this.broadcastToAllClients({
        type: 'session-ended',
        sessionId: message.sessionId,
        timestamp: new Date().toISOString(),
        initiatedBy: client.type
      });

      client.sessionId = undefined;
    }
  }
  private broadcastEvent(senderId: string, message: ClientMessage): void {
    const senderClient = this.clients.get(senderId);
    if (!senderClient) {
      console.warn(`Unknown sender client: ${senderId}`);
      return;
    }

    console.log(`📤 Event received: ${message.data?.type || 'unknown'}`);

    // Broadcast to all other clients (excluding sender)
    this.broadcastToOtherClients(senderId, {
      type: 'event',
      data: message.data,
      timestamp: new Date().toISOString(),
      from: senderClient.type,
      sessionId: message.sessionId
    });
  }

  private broadcastToAllClients(message: any): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  private broadcastToOtherClients(excludeClientId: string, message: any): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  private broadcastToClientType(clientType: 'chrome-extension' | 'vscode-extension', message: any): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.type === clientType && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  public getConnectedClients(): Array<{ id: string; type: string; sessionId?: string }> {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      type: client.type,
      sessionId: client.sessionId
    }));
  }

  public stop(): void {
    console.log('Stopping TestCaptive Bridge Server...');
    this.server.close();
  }
}

// Start the server
const bridge = new TestCaptiveBridge(3000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\nReceived SIGINT, shutting down gracefully...');
  bridge.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\nReceived SIGTERM, shutting down gracefully...');
  bridge.stop();
  process.exit(0);
});

export { TestCaptiveBridge, TestEvent, ClientMessage };
