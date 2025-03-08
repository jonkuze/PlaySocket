// Required Modules
import { actions } from '../modules/store.js'
import { eventLog } from '../modules/util.js'

// On Disconnect
export default function onDisconnect(ws, req) {
  // Client ID
  const client_id = req.headers['sec-websocket-key']

  // Handle Disconnect
  ws.on('close', () => {
    // Delete Lobby CCU On Disconnect
    actions.deleteCCU()

    // Delete Lobby Connection On Disconnect
    actions.quitLobbyServer({ client_id })

    // Log Client Disconnect
    eventLog({ 
      request: 'Client Disconnect', 
      status: 'Success', 
      message: `Client @ ${client_id} Disconnected!`,
    })
  })
}