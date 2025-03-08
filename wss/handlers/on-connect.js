// Required Modules
import { actions } from '../modules/store.js'
import { eventLog } from '../modules/util.js'

// On Connect
export default function onConnect(ws, req) {
  // Client ID
  const client_id = req.headers['sec-websocket-key']

  // Add CCU On Connect
  actions.addCCU({ client_id })

  // Log Client Connection
  eventLog({ 
    request: 'Client Connection', 
    status: 'Success', 
    message: `Client @ ${client_id} Connected!`,
  })
}