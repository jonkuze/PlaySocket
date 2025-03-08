// Required Modules
import { state, actions } from '../modules/store.js'
import { eventLog } from '../modules/util.js'

// On Message
export default function onMessage(ws, req) {
  // Client ID
  const client_id = req.headers['sec-websocket-key']

  // Handle Message
  ws.on('message', (msg) => {
    // Init Variables
    let request, server_id, is_public, version
    
    // Parse ArraySegment<byte> created using Encoding.ASCII.GetBytes(string) to JSON
    request = JSON.parse(msg.toString()).request
    server_id = JSON.parse(msg.toString()).server_id
    is_public = JSON.parse(msg.toString()).is_public
    version = JSON.parse(msg.toString()).version

    // Parse Boolean
    if (is_public === 'true') is_public = true
    else if (is_public === 'false') is_public = false

    switch(request) {
      case 'Join Lobby Server': 
        actions.joinLobbyServer({ server_id, client_id })
        state.lobby.connections[client_id].server_heartbeat = setInterval(() => ws.send(0, { binary: true }), 5000)
        eventLog({ 
          request: request, 
          status: 'Success',
          message: { request, server_id, client_id }
        }) 
        break
      case 'Start Game Server': 
        actions.deployServer({ is_public, client_id, version })
        eventLog({
          request: request, 
          status: 'Success',
          message: { request, client_id }
        })
        break
      case 'Join Game Server': 
        actions.joinGameServer({ server_id })
        eventLog({ 
          request: request,
          status: 'Success',
          message: { request, server_id, client_id }
        })
        break
      case 'Update Game Server':
        actions.updateGameServer({ server_id })
        eventLog({ 
          request: request,
          status: 'Success',
          message: { request, server_id }
        })
        break
      case 'Quit Game Server':
        actions.quitGameServer({ server_id })
        eventLog({ 
          request: request,
          status: 'Success',
          message: { request, server_id, client_id }
        })
        break
      case 'Get Public Server List':
        ws.send(JSON.stringify(state.server.list.filter(
          (server) => server.is_public && server.ccu < server.max_ccu && server.version === version)), { binary: true })
        break;
      case 'Get Private Server List': 
        ws.send(JSON.stringify(state.server.list.filter(
          (server) => !server.is_public && server.host_id === client_id)), { binary: true })
        break;
    }
  })
}