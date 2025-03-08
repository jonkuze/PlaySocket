// Required Modules
import { eventLog } from '../modules/util.js'

// On Error
export default function onError(ws) {
  // Handle Error
  ws.on('error', (error) => {
    // Log Incoming Message
    eventLog({ 
      request: 'Log Error', 
      status: 'Failed', 
      message: error
    })
  })
}