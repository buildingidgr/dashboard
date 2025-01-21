import { type TElement } from '@udecode/plate-common';
import { Manager } from 'socket.io-client';
import { getAccessToken } from '@/lib/services/auth';

interface PlateContent {
  type: 'doc';
  content: TElement[];
}

interface DocumentUpdate {
  type: string;
  documentId: string;
  userId: string;
  content?: PlateContent;
  data?: {
    position?: { line: number; ch: number };
    status?: 'online' | 'offline' | 'idle';
  };
}

interface ServerToClientEvents {
  'document:joined': (data: { documentId: string; userId: string }) => void;
  'document:update': (data: DocumentUpdate) => void;
  'document:cursor': (data: { documentId: string; userId: string; position: { line: number; ch: number } }) => void;
  'document:presence': (data: { documentId: string; userId: string; status: 'online' | 'offline' | 'idle' }) => void;
  'error': (error: { message: string }) => void;
}

interface ClientToServerEvents {
  'document:join': (documentId: string) => void;
  'document:update': (data: DocumentUpdate) => void;
  'document:cursor': (data: { documentId: string; userId: string; position: { line: number; ch: number } }) => void;
  'document:presence': (data: { documentId: string; userId: string; status: 'online' | 'offline' | 'idle' }) => void;
}

type SocketType = ReturnType<typeof Manager.prototype.socket>;

export class DocumentWebSocket {
  private socket: SocketType | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private messageQueue: any[] = [];
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

    // Save if enough time has passed since last save and we have changes
    // or if we've reached the force save interval
    if ((this.pendingChanges && timeSinceLastSave >= this.SAVE_INTERVAL) || 
        timeSinceLastSave >= this.FORCE_SAVE_INTERVAL) {
      await this.saveDocument();
    }
  }

  private async saveDocument() {
    if (!this.currentContent || !this.documentId) return;

    try {
      this.saveInProgress = true;

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

    } catch (error) {
      console.error('Save failed:', {
        documentId: this.documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      // Keep pendingChanges true so we retry on next interval
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
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  private async validateAndConnect() {
    const isValid = await this.validateToken();
    if (!isValid) {
      console.error('Token validation failed, not connecting Socket.IO');
      return;
    }
    await this.connect();
  }

  private setupVisibilityHandler() {
    if (typeof window === 'undefined') return;

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
      const config = {
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

      console.log('Socket.IO configuration:', {
        ...config,
        auth: { token: 'Bearer [REDACTED]' }
      });

      // Create manager with config
      const manager = new Manager('wss://documents-production.up.railway.app', config);

      // Create socket and set auth explicitly
      this.socket = manager.socket('/');
      this.socket.auth = { token: `Bearer ${this.token}` };

      // Set up event handlers before connecting
      this.socket.on('connect', () => {
        console.log('Socket.IO connected successfully:', {
          socketId: this.socket?.id,
          transport: (this.socket as any)?.io?.engine?.transport?.name || 'unknown'
        });
        this.isConnecting = false;
        this.isAuthenticated = true;
        this.reconnectAttempts = 0;

        if (this.documentId) {
          console.log('Joining document:', this.documentId);
          this.socket.emit('document:join', this.documentId);
        }

        this.flushMessageQueue();
        this.sendPresence('online');
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          token: this.token ? 'Bearer [REDACTED]' : 'no token'
        });
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.handleReconnection();
      });

      this.socket.on('error', (error: Error) => {
        console.error('Socket.IO error:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        this.handleReconnection();
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Socket.IO disconnected:', {
          reason,
          socketId: this.socket?.id,
          wasAuthenticated: this.isAuthenticated,
          reconnectAttempts: this.reconnectAttempts,
          transport: (this.socket as any)?.io?.engine?.transport?.name || 'unknown'
        });
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.handleReconnection();
      });

      // Set up event handlers for document events
      this.socket.on('document:update', (data: DocumentUpdate) => {
        console.log('Received document update:', data);
        if (data.content) {
          this.onUpdate({
            documentId: data.documentId,
            content: {
              type: data.content.type,
              content: data.content.content
            }
          });
        }
      });

      this.socket.on('document:cursor', (data: { documentId: string; userId: string; position: { line: number; ch: number } }) => {
        console.log('Received cursor update:', data);
        this.onCursor(data.userId, data.position);
      });

      this.socket.on('document:presence', (data: { documentId: string; userId: string; status: 'online' | 'offline' | 'idle' }) => {
        console.log('Received presence update:', data);
        this.onPresence(data.userId, data.status);
      });

      // Connect
      console.log('Connecting Socket.IO...');
      this.socket.connect();

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.isConnecting = false;
      this.isAuthenticated = false;
      this.handleReconnection();
    }
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

  private sendMessage(message: any) {
    if (!this.socket?.connected) {
      console.log('Socket.IO not connected, queueing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      switch (message.type) {
        case 'update':
          const updateMessage = {
            type: 'update',
            documentId: this.documentId,
            userId: this.extractUserIdFromToken(this.token),
            content: message.data.content
          };
          console.log('Sending document update:', updateMessage);
          this.socket.emit('document:update', updateMessage);
          break;
        case 'cursor':
          this.socket.emit('document:cursor', {
            documentId: this.documentId,
            userId: this.extractUserIdFromToken(this.token),
            position: message.data.position
          });
          break;
        case 'presence':
          this.socket.emit('document:presence', {
            documentId: this.documentId,
            userId: this.extractUserIdFromToken(this.token),
            status: message.data.status
          });
          break;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageQueue.push(message);
    }
  }

  private extractUserIdFromToken(token: string): string {
    try {
      // JWT tokens are base64 encoded with format: header.payload.signature
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.sub;  // User ID is stored in the 'sub' claim
    } catch (error) {
      console.error('Failed to extract user ID from token:', error);
      throw new Error('Invalid authentication token');
    }
  }

  public sendUpdate(content: TElement[]) {
    // Clean and store the current content for autosave
    this.currentContent = content.map(node => ({
      type: node.type,
      children: node.children,
      ...(node.id ? { id: node.id } : {})
    }));
    this.pendingChanges = true;

    // Clear existing timeout if any
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set a new timeout for saving
    this.saveTimeout = setTimeout(async () => {
      await this.checkAndSave();
    }, this.SAVE_INTERVAL);

    // Send real-time update via WebSocket
    this.sendMessage({
      type: 'update',
      documentId: this.documentId,
      data: {
        content: {
          type: 'doc',
          content: this.currentContent
        }
      }
    });
  }

  public sendCursor(position: { line: number; ch: number }) {
    this.sendMessage({
      type: 'cursor',
      documentId: this.documentId,
      data: {
        position
      }
    });
  }

  public sendPresence(status: 'online' | 'offline' | 'idle') {
    this.sendMessage({
      type: 'presence',
      documentId: this.documentId,
      data: {
        status
      }
    });
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