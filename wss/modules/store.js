// Required ModulesServer
import { eventLog } from './util.js'
import server from './server.js'
import Deployment from '../classes/Deployment.js'

// State
export const state = {
  lobby: {
    ccu: 0,
    connections: {
    }
  },
  server: {
    count: 0,
    max_ccu: 4,
    list: []
  },
  delay: {
    server_monitor: {
      loop: 15000,
      start: 15000
    },
    check_server: {
      loop: 2000,
      start: 2000
    }
  }
}

// Actions
export const actions = {
  addCCU({ client_id }) {
    ++state.lobby.ccu
    state.lobby.connections[client_id] = {
      server_id: null,
      server_heartbeat: null
    }
  },
  getCCU() {
    let ccu = 0
    state.server.list.forEach((server) => ccu += server.ccu)
    ccu += state.lobby.ccu
    return ccu
  },
  deleteCCU() {
    if (state.lobby.ccu !== 0) --state.lobby.ccu
  },
  joinLobbyServer({ server_id, client_id }) {
    const server_index = state.server.list.findIndex((server) => {
      return server.id === server_id
    })

    // if client has server_id, add server_id to client's lobby connection
    if (server_index !== -1) {
      state.lobby.connections[client_id].server_id = server_id
    }
  },
  joinGameServer({ server_id }) {
    const server_index = state.server.list.findIndex((server) => {
      return server.id === server_id
    })

    if (server_index !== -1) {
      ++state.server.list[server_index].ccu
      actions.updateServerCapacity(server_index)
    }
  },
  updateGameServer({ server_id }) {
    const server_index = state.server.list.findIndex((server) => {
      return server.id === server_id
    })

    if (server_index !== -1) {
      state.server.list[server_index].last_update = Date.now()
    }
  },
  quitGameServer({ server_id }) {
    const server_index = state.server.list.findIndex((server) => {
      return server.id === server_id
    })

    if (server_index !== -1) {
      --state.server.list[server_index].ccu
      if (state.server.list[server_index].ccu < 0) state.server.list[server_index].ccu = 0
      actions.updateServerCapacity(server_index)
    }
  },
  async quitLobbyServer({ client_id }) {
    // Handle Game Server Disconnect From Lobby
    if (state.lobby.connections[client_id] && state.lobby.connections[client_id].server_id) {
      const server_id = state.lobby.connections[client_id].server_id
      const server_index = state.server.list.findIndex((server) => {
        return server.id === server_id
      })

      if (server_index !== -1) {
        const delete_server_request = await server.delete(state.server.list[server_index].id)

        state.server.list.splice(server_index, 1)
        clearInterval(state.lobby.connections[client_id].server_heartbeat)
        delete state.lobby.connections[client_id]

        // Log Delete Game Server Request
        eventLog({
          request: 'Delete Game Server',
          status: delete_server_request.status,
          message: delete_server_request.statusText,
        })
      }
    } else {
      // Handle Client Disconnect From Lobby
      if (state.lobby.connections[client_id]) {
        clearInterval(state.lobby.connections[client_id].server_heartbeat)
        delete state.lobby.connections[client_id]
      }
    }
  },
  updateServerCapacity(server_index) {
    if (state.server.list[server_index].ccu === state.server.max_ccu) {
      state.server.list[server_index].capacity = '100%'
    } else if (state.server.list[server_index].ccu >= (state.server.max_ccu / 2)) {
      state.server.list[server_index].capacity = '50%'
    } else if (state.server.list[server_index].ccu !== 0 &&
      state.server.list[server_index].ccu < (state.server.max_ccu / 2)) {
      state.server.list[server_index].capacity = '25%'
    } else if (state.server.list[server_index].ccu === 0) {
      state.server.list[server_index].capacity = '0%'
    }

    // Log Update Server Capacity Request
    eventLog({
      request: 'Update Server Capacity',
      status: 'Success',
      message: state.server.list
    })
  },
  async deployServer({ is_public, client_id, version }) {
    const deploy_server_request = await server.deploy({ is_public, version })

    if (deploy_server_request.status === 200) {
      setTimeout(() => actions.checkServer({
        request_id: deploy_server_request.data.request_id,
        is_public,
        client_id,
        version
      }), state.delay.check_server.loop)
    } else {
      eventLog({
        request: 'Deploy Server',
        status: deploy_server_request.status,
        message: deploy_server_request.statusText
      })
    }
  },
  async checkServer({ request_id, is_public, client_id, version }) {
    const check_server_request = await server.status(request_id)

    if (check_server_request.status === 200 && check_server_request.data.running) {
      actions.addServer(check_server_request.data, is_public, client_id, version)
    } else if (check_server_request.status === 200 && !check_server_request.data.running) {
      setTimeout(() => actions.checkServer({ request_id, is_public, client_id, version }), state.delay.check_server.loop)
    } else {
      eventLog({
        request: 'Check Server',
        id: request_id,
        status: check_server_request.status,
        message: check_server_request.statusText
      })
    }
  },
  addServer({ request_id, fqdn, ports }, is_public, client_id, version) {
    const deployment = new Deployment({
      id: request_id,
      ip: fqdn,
      port: ports['7778'].external,
      max_ccu: state.server.max_ccu,
      is_public,
      host_id: client_id,
      version
    })

    state.server.list.push(deployment)
  },
  async deleteServer(server_index) {
    if (server_index !== undefined) {
      const delete_server_request = await server.delete(state.server.list[server_index].id)

      if (delete_server_request.status === 200) {
        state.server.list.splice(server_index, 1)

        eventLog({
          request: 'Delete Server',
          status: delete_server_request.status,
          message: delete_server_request.statusText
        })
      } else {
        eventLog({
          request: 'Delete Server',
          status: delete_server_request.status,
          message: delete_server_request.statusText
        })
      }
    }
  },
  async serverMonitor() {
    const server_list = []

    state.server.list.forEach((server) => {
      // Remove Server From List If No Update In 15 Seconds
      if (server.last_update < (Date.now() - state.delay.server_monitor.loop)) {
        const server_index = state.server.list.findIndex((s) => {
          return s.id === server.id
        })
        state.server.list.splice(server_index, 1)
        console.log('Server Removed: ', server.id)
      } else {
        server_list.push({ id: server.id, capacity: server.capacity, ccu: server.ccu, version: server.version })
      }
    })

    console.log('Lobby CCU: ', state.lobby.ccu)
    console.log('Server Count: ', server_list.length)
    console.log(server_list);
    setTimeout(() => actions.serverMonitor(), state.delay.server_monitor.loop)
  },
  async startLobby() {
    const server_list_request = await server.list({ page: 1 })
    const server_list_requests = { status: null, statusText: null, }
    const server_list = []

    try {
      if (server_list_request.status === 200) {
        server_list.push(...server_list_request.data.data)

        for (let page_index = 2; page_index <= server_list_request.data.pagination.paginator.num_pages; page_index++) {
          await server.list({ page: page_index })
            .then((response) => {
              server_list.push(...response.data.data)
            })
        }

        server_list_requests.status = 200
      }
    } catch (error) {
      server_list_requests.status = 400
      server_list_requests.statusText = error.message
    }

    if (server_list_requests.status === 200) {
      for (let server_index = 0; server_index < server_list.length; server_index++) {
        const version = server_list[server_index].tags.find((tag) => tag.includes('v') && tag.includes('-')).split('v')[1]
        const is_public = () => {
          if (server_list[server_index].tags.includes('public')) return true
          else return false
        }
        const deployment = new Deployment({
          id: server_list[server_index].request_id,
          ip: server_list[server_index].fqdn,
          port: server_list[server_index].ports['7778'].external,
          max_ccu: state.server.max_ccu,
          is_public,
          host_id: server_list[server_index].client_id,
          version
        })
        state.server.list.push(deployment)
      }

      setTimeout(() => actions.serverMonitor(), state.delay.server_monitor.start)

      return {
        request: 'Start Lobby',
        status: server_list_requests.status,
        message: 'Successfully Started Lobby Server!',
      }
    } else {
      return {
        request: 'Start Lobby',
        status: server_list_requests.status,
        message: server_list_requests.statusText
      }
    }
  }
}