// Required Modules
import { WebSocketServer as WSS } from 'ws';
import { onConnect, onMessage, onDisconnect, onError } from './handlers/index.js'

// WebSocket Server
function WebSocketServer(server) {
  // Init WebSocket Server
  const wss = new WSS({ server })

  // WebSocket Server Listener
  wss.on('connection', (ws, req) => {
    // Connect Handler
    onConnect(ws, req)

    // Message Handler
    onMessage(ws, req)

    // Disconnect Handler
    onDisconnect(ws, req)

    // Error Handler
    onError(ws, req)
  })
}

export default WebSocketServer