// WebSocket client for communicating with the bridge server
import WebSocket from 'ws';
import * as vscode from 'vscode';

export interface TestEvent {
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
    name?: string;
    type?: string;
    placeholder?: string;
  };
  page: {
    url: string;
    title: string;
  };
  value?: string;
  sessionId: string;
}

export interface WebSocketMessage {
  type: 'register' | 'event' | 'session-start' | 'session-end' | 'test-event' | 'session-started' | 'session-ended' | 'registration-success' | 'client-connected' | 'navigate-to-url';
  clientType?: 'chrome-extension' | 'vscode-extension';
  data?: any;
  sessionId?: string;
  timestamp?: string;
  from?: string;
  clientId?: string;
  initiatedBy?: string;
  url?: string;
  autoLaunch?: boolean;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private port: number;

  // Event handlers
  private onSessionStartedHandler?: (sessionId: string) => void;
  private onSessionEndedHandler?: (sessionId: string) => void;
  private onEventReceivedHandler?: (event: TestEvent) => void;
  private onConnectionStatusChangedHandler?: (connected: boolean) => void;

  constructor() {
    this.port = vscode.workspace.getConfiguration('testcaptive').get('bridgeServerPort', 3000);
  }  public connect(): void {
    const url = `ws://localhost:${this.port}`;
    console.log(`TestCaptive: Attempting to connect to ${url}`);
    
    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('TestCaptive: Connected to bridge server');
        this.reconnectAttempts = 0;
        
        // Register as VS Code extension client
        this.send({
          type: 'register',
          clientType: 'vscode-extension'
        });

        this.onConnectionStatusChangedHandler?.(true);
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          console.log('TestCaptive: Received message:', message);
          this.handleMessage(message);
        } catch (error) {
          console.error('TestCaptive: Failed to parse WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('TestCaptive: WebSocket connection closed');
        this.onConnectionStatusChangedHandler?.(false);
        this.attemptReconnect();
      });

      this.ws.on('error', (error: Error) => {
        console.error('TestCaptive: WebSocket error:', error);
        this.onConnectionStatusChangedHandler?.(false);
      });

    } catch (error) {
      console.error('TestCaptive: Failed to connect to WebSocket:', error);
      this.onConnectionStatusChangedHandler?.(false);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached. Please restart the bridge server.');
      vscode.window.showErrorMessage('Could not connect to TestCaptive bridge server. Please ensure it is running.');
    }  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('WebSocket message received:', message);
    switch (message.type) {
      case 'registration-success':
        console.log('Successfully registered with bridge server');
        break;
      
      case 'client-connected':
        console.log('Client connected:', message.clientType, 'with ID:', message.clientId);
        break;
      
      case 'session-started':
        console.log('Session started message received:', message.sessionId);
        if (message.sessionId) {
          this.onSessionStartedHandler?.(message.sessionId);
        }
        break;
      
      case 'session-ended':
        console.log('Session ended message received:', message.sessionId);
        if (message.sessionId) {
          this.onSessionEndedHandler?.(message.sessionId);
        }
        break;
        case 'test-event':
      case 'event':
        console.log('Event received:', message.data, 'from:', message.from);
        if (message.data && (message.from === 'chrome-extension' || message.clientType === 'chrome-extension')) {
          // Transform the event data to match our interface
          const transformedEvent: TestEvent = {
            event: message.data.type || message.data.event || 'unknown',
            timestamp: message.data.timestamp || message.timestamp || new Date().toISOString(),
            element: {
              tag: message.data.element?.tag || '',
              text: message.data.element?.text || '',
              id: message.data.element?.id || '',
              class: message.data.element?.className || message.data.element?.class || '',
              name: message.data.element?.name || '',
              type: message.data.element?.type || '',
              placeholder: message.data.element?.placeholder || '',
              cssSelector: message.data.selector || ''
            },
            page: {
              url: message.data.page?.url || '',
              title: message.data.page?.title || ''
            },
            value: message.data.inputValue || message.data.value || '',
            sessionId: message.data.sessionId || message.sessionId || ''
          };
          this.onEventReceivedHandler?.(transformedEvent);
        }
        break;
      
      default:
        console.log('Received unknown message from bridge:', message);
    }
  }

  public send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }  public startSession(sessionId: string, url?: string): void {
    const message: WebSocketMessage = {
      type: 'session-start' as const,
      clientType: 'vscode-extension',
      sessionId: sessionId,
      url: url,
      autoLaunch: !!url
    };
    
    console.log('TestCaptive: VSCode sending startSession message:', message);
    this.send(message);
  }

  public endSession(sessionId: string): void {
    this.send({
      type: 'session-end',
      clientType: 'vscode-extension',
      sessionId: sessionId
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Event handler setters
  public onSessionStarted(handler: (sessionId: string) => void): void {
    this.onSessionStartedHandler = handler;
  }

  public onSessionEnded(handler: (sessionId: string) => void): void {
    this.onSessionEndedHandler = handler;
  }

  public onEventReceived(handler: (event: TestEvent) => void): void {
    this.onEventReceivedHandler = handler;
  }

  public onConnectionStatusChanged(handler: (connected: boolean) => void): void {
    this.onConnectionStatusChangedHandler = handler;
  }
}
