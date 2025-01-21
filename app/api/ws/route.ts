import { NextRequest } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

// This is needed to tell Next.js this is a WebSocket route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface WebSocketConnection {
  socket: WebSocket;
  documentId: string | null;
  userId: string | null;
}

const wss = new WebSocketServer({ noServer: true });
const connections = new Map<WebSocket, WebSocketConnection>();

wss.on('connection', (socket: WebSocket) => {
  console.log('WebSocket connected');
  connections.set(socket, { socket, documentId: null, userId: null });

  socket.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      const connection = connections.get(socket);
      
      if (!connection) return;

      switch (message.type) {
        case 'auth':
          // Here you would validate the token
          // For now, we'll just store it
          connection.userId = message.token;
          break;

        case 'subscribe':
          connection.documentId = message.documentId;
          break;

        case 'update':
          // Broadcast the update to all other clients viewing the same document
          for (const [_, conn] of connections) {
            if (conn.documentId === message.documentId && conn.socket !== socket) {
              conn.socket.send(JSON.stringify(message));
            }
          }
          break;

        case 'cursor':
          // Broadcast cursor position to all other clients viewing the same document
          for (const [_, conn] of connections) {
            if (conn.documentId === message.documentId && conn.socket !== socket) {
              conn.socket.send(JSON.stringify(message));
            }
          }
          break;

        case 'presence':
          // Broadcast presence update to all other clients viewing the same document
          for (const [_, conn] of connections) {
            if (conn.documentId === message.documentId && conn.socket !== socket) {
              conn.socket.send(JSON.stringify(message));
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  socket.on('close', () => {
    console.log('WebSocket closed');
    connections.delete(socket);
  });

  socket.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
    connections.delete(socket);
  });
});

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  try {
    // @ts-ignore - Next.js types don't include the socket property
    const { socket, head } = req;
    
    if (!socket) {
      throw new Error('No socket found on request');
    }

    wss.handleUpgrade(req as unknown as IncomingMessage, socket, head || Buffer.from(''), (ws: WebSocket) => {
      wss.emit('connection', ws, req);
    });

    return new Response(null, { status: 101 });
  } catch (error) {
    console.error('Error handling WebSocket connection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 