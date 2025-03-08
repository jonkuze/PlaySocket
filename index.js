// Required Modules
import express from 'express'
import cors from 'cors'
import http from 'http'
import router from './api/router.js'
import WebSocketServer from './wss/index.js'
import { actions } from './wss/modules/store.js'
import { eventLog } from './wss/modules/util.js'

// Init App
const app = express()
app.use(cors())
app.use(router)

// Init Server
const server = http.createServer(app)
const port = 80

// Start Lobby
async function startLobby() {
  const start_lobby_request = await actions.startLobby()

  // Start WebSocket & HTTP Server
  if (start_lobby_request.status === 200) {
    WebSocketServer(server)
    server.listen(port, () => {
      eventLog({ 
        request: 'Start Lobby', 
        status: start_lobby_request.status, 
        message: start_lobby_request.message
      })
    })
  } else {
    // Log Error
    eventLog({ 
      request: 'Start Lobby', 
      status: start_lobby_request.status, 
      message: start_lobby_request.message
    })
  }
}
startLobby()
