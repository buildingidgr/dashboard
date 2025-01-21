import { type TElement } from '@udecode/plate-common';
import { Manager } from 'socket.io-client';

interface PlateContent {
  type: 'doc';
  content: TElement[];
}

interface DocumentUpdate {
  type: 'update' | 'cursor' | 'presence';
  documentId: string;
  userId: string;
  content?: {
    type: 'doc';
    content: TElement[];
  };
  position?: { line: number; ch: number };
  status?: 'online' | 'offline' | 'idle';
}

type Message = {
  type: 'document:update' | 'document:cursor' | 'document:presence';
  data: DocumentUpdate;
};

type SocketType = ReturnType<typeof Manager.prototype.socket>;

interface SocketTransport {
  name: string;
}

interface SocketEngine {
  transport: SocketTransport;
}

interface SocketEventHandlers {
  connect: () => void;
  disconnect: (reason: string) => void;
  'document:update': (data: DocumentUpdate) => void;
  'document:cursor': (data: DocumentUpdate) => void;
  'document:presence': (data: DocumentUpdate) => void;
  error: (error: Error) => void;
  connect_error: (error: Error) => void;
}

interface SocketEmitEvents {
  'document:join': (documentId: string) => void;
  'document:update': (data: DocumentUpdate) => void;
  'document:cursor': (data: DocumentUpdate) => void;
  'document:presence': (data: DocumentUpdate) => void;
}

interface ExtendedSocket extends SocketType {
  io?: {
    engine?: SocketEngine;
  };
  on<T extends keyof SocketEventHandlers>(event: T, handler: SocketEventHandlers[T]): this;
  emit<T extends keyof SocketEmitEvents>(event: T, ...args: Parameters<SocketEmitEvents[T]>): this;
}

interface SocketConfig {
  transports: string[];
  auth: { token: string };
  timeout: number;
  forceNew: boolean;
  autoConnect: boolean;
  withCredentials: boolean;
  pingInterval: number;
  pingTimeout: number;
  maxHttpBufferSize: number;
  reconnection: boolean;
}

export class DocumentWebSocket {
  private socket: ExtendedSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private messageQueue: Message[] = [];
  private isAuthenticated = false;
  private readonly BASE_URL = 'https://documents-production.up.railway.app';
  private readonly AUTH_URL = 'https://auth-service-production-16ee.up.railway.app';
  private isConnecting = false;
  private closeRequested = false;

  // Autosave related properties
  private lastSaveTime: number = 0;
  private pendingChanges: boolean = false;
  private saveInProgress: boolean = false;
  private readonly SAVE_INTERVAL = 3000; // Save after 3 seconds of changes
  private readonly FORCE_SAVE_INTERVAL = 30000; // Force save every 30 seconds
  private currentContent: TElement[] | null = null;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private documentId: string,
    private token: string,
    private onUpdate: (data: { documentId: string; content: PlateContent }) => void,
    private onCursor: (userId: string, position: { line: number; ch: number }) => void,
    private onPresence: (userId: string, status: 'online' | 'offline' | 'idle') => void
  ) {
    this.validateAndConnect();
    this.setupVisibilityHandler();
    this.startAutoSave();
  }

  private startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      await this.checkAndSave();
    }, 5000); // Check every 5 seconds
  }

  private async checkAndSave() {
    if (this.saveInProgress || !this.currentContent) return;

    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;

    if ((this.pendingChanges && timeSinceLastSave >= this.SAVE_INTERVAL) || 
        timeSinceLastSave >= this.FORCE_SAVE_INTERVAL) {
      await this.saveDocument();
    }
  }

  private async saveDocument(): Promise<void> {
    if (!this.currentContent) return;

    this.saveInProgress = true;
    try {
      // Ensure content is properly structured without nesting
      const documentState = {
        title: "Untitled",
        content: {
          type: 'doc',
          content: this.currentContent.map(node => ({
            type: node.type,
            children: node.children,
            ...(node.id ? { id: node.id } : {})
          }))
        }
      };

      // Log the actual payload being sent
      console.debug('Saving document - Payload:', JSON.stringify(documentState, null, 2));

      const response = await fetch(`${this.BASE_URL}/api/document/${this.documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(documentState)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed - Server response:', {
          status: response.status,
          error: errorText
        });
        throw new Error('Failed to save document');
      }

      this.lastSaveTime = Date.now();
      this.pendingChanges = false;

      console.debug('Document saved successfully:', {
        documentId: this.documentId,
        timestamp: new Date().toISOString()
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error saving document:', errorMessage);
    } finally {
      this.saveInProgress = false;
    }
  }

  public setDocumentId(documentId: string) {
    this.documentId = documentId;
    if (this.socket?.connected && this.isAuthenticated) {
      console.log('Joining document:', documentId);
      this.socket.emit('document:join', documentId);
    }
  }

  private async validateToken(): Promise<boolean> {
    try {
      console.log('Validating token with auth service...');
      
      const response = await fetch(`${this.AUTH_URL}/v1/token/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token: this.token
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token validation failed:', {
          status: response.status,
          error: errorText
        });
        return false;
      }

      const data = await response.json();
      console.log('Token validation response:', data);
      return data.isValid === true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error validating token:', errorMessage);
      return false;
    }
  }

  private async validateAndConnect() {
    if (!this.token) {
      throw new Error('Authentication token is required');
    }
    if (!this.documentId) {
      throw new Error('Document ID is required');
    }
    this.connect();
  }

  private setupVisibilityHandler() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendPresence('idle');
      } else {
        this.sendPresence('online');
      }
    });

    // Setup cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  private async connect() {
    if (this.isConnecting || this.closeRequested) {
      console.log('Socket.IO is already connecting or close was requested');
      return;
    }

    this.isConnecting = true;
    this.closeRequested = false;

    try {
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      console.log(`Connecting to Socket.IO (attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);

      // Create Socket.IO manager with exact specifications
      const config: SocketConfig = {
        transports: ['polling', 'websocket'],
        auth: {
          token: `Bearer ${this.token}`
        },
        timeout: 10000,
        forceNew: true,
        autoConnect: false,
        withCredentials: true,
        pingInterval: 25000,
        pingTimeout: 20000,
        maxHttpBufferSize: 100000000, // 100 MB
        reconnection: false  // We'll handle reconnection manually
      };

      const loggableConfig: Omit<SocketConfig, 'auth'> & { auth: { token: string } } = {
        ...config,
        auth: { token: 'Bearer [REDACTED]' }
      };

      console.log('Socket.IO configuration:', loggableConfig);

      // Create manager with config
      const manager = new Manager('wss://documents-production.up.railway.app', config);

      // Create socket and set auth explicitly
      this.socket = manager.socket('/') as ExtendedSocket;
      this.socket.auth = { token: `Bearer ${this.token}` };

      // Set up event handlers before connecting
      if (!this.socket) return;

      this.setupSocketEventHandlers(this.socket);

      // Connect
      console.log('Connecting Socket.IO...');
      this.socket.connect();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error creating Socket.IO connection:', errorMessage);
      this.isConnecting = false;
      this.isAuthenticated = false;
      this.handleReconnection();
    }
  }

  private setupSocketEventHandlers(socket: ExtendedSocket) {
    socket.on('connect', () => {
      if (!socket) return;
      const transport = socket.io?.engine?.transport?.name;
      console.log('Socket.IO connected successfully:', {
        socketId: socket.id,
        transport: transport || 'unknown'
      });
      this.isConnecting = false;
      this.isAuthenticated = true;
      this.reconnectAttempts = 0;

      if (this.documentId) {
        console.log('Joining document:', this.documentId);
        socket.emit('document:join', this.documentId);
      }

      this.flushMessageQueue();
      this.sendPresence('online');
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Socket.IO disconnected:', reason);
      this.isAuthenticated = false;
      this.handleDisconnect(reason);
    });

    socket.on('document:update', (data: DocumentUpdate) => {
      if (data.type === 'update' && data.content) {
        this.onUpdate({
          documentId: data.documentId,
          content: data.content
        });
      }
    });

    socket.on('document:cursor', (data: DocumentUpdate) => {
      if (data.type === 'cursor' && data.position) {
        this.onCursor(data.userId, data.position);
      }
    });

    socket.on('document:presence', (data: DocumentUpdate) => {
      if (data.type === 'presence' && data.status) {
        this.onPresence(data.userId, data.status);
      }
    });

    socket.on('error', (error: Error) => {
      console.error('Socket.IO error:', error);
      this.handleError(error);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      this.handleConnectionError(error);
    });
  }

  private handleDisconnect(reason: string) {
    console.log('Socket.IO disconnected:', {
      reason,
      socketId: this.socket?.id,
      wasAuthenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      transport: this.socket?.io?.engine?.transport?.name || 'unknown'
    });
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.handleReconnection();
  }

  private handleError(error: Error) {
    console.error('Socket.IO error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    this.handleReconnection();
  }

  private handleConnectionError(error: Error) {
    console.error('Socket.IO connection error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      token: this.token ? 'Bearer [REDACTED]' : 'no token'
    });
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.handleReconnection();
  }

  private handleReconnection() {
    if (this.closeRequested) return;

    this.reconnectAttempts++;
    if (this.reconnectAttempts < 10) { // Maximum 10 reconnection attempts
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max delay 30 seconds
      console.log(`Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/10)`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private flushMessageQueue() {
    console.log(`Flushing message queue (${this.messageQueue.length} messages)`);
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private sendMessage(message: Message) {
    if (!this.socket?.connected || !this.isAuthenticated) {
      console.log('Socket not ready, queueing message:', message);
      this.messageQueue.push(message);
      return;
    }

    try {
      console.log('Sending message:', message);
      this.socket.emit(message.type, message.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending message:', errorMessage);
      this.messageQueue.push(message);
    }
  }

  private extractUserIdFromToken(token: string): string {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        throw new Error('Invalid token format');
      }
      const decodedPayload = JSON.parse(atob(payload));
      if (!decodedPayload.sub) {
        throw new Error('Token missing user ID');
      }
      return decodedPayload.sub;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to extract user ID from token:', errorMessage);
      throw new Error('Invalid authentication token');
    }
  }

  public sendUpdate(content: TElement[]) {
    this.currentContent = content;
    this.pendingChanges = true;

    // Send real-time update via WebSocket
    this.sendMessage({
      type: 'document:update',
      data: {
        type: 'update',
        documentId: this.documentId,
        userId: this.extractUserIdFromToken(this.token),
        content: {
          type: 'doc',
          content
        }
      }
    });
  }

  public sendCursor(position: { line: number; ch: number }) {
    this.sendMessage({
      type: 'document:cursor',
      data: {
        type: 'cursor',
        documentId: this.documentId,
        userId: this.extractUserIdFromToken(this.token),
        position
      }
    });
  }

  public sendPresence(status: 'online' | 'offline' | 'idle') {
    const message: Message = {
      type: 'document:presence',
      data: {
        type: 'presence',
        documentId: this.documentId,
        userId: this.socket?.id || '',
        status
      }
    };
    this.sendMessage(message);
  }

  public disconnect() {
    this.closeRequested = true;
    
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    // Final save if there are pending changes
    if (this.pendingChanges && this.currentContent) {
      this.saveDocument().finally(() => {
        if (this.socket) {
          this.sendPresence('offline');
          this.socket.close();
          this.socket = null;
        }
      });
    } else if (this.socket) {
      this.sendPresence('offline');
      this.socket.close();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected === true && this.isAuthenticated;
  }
} 