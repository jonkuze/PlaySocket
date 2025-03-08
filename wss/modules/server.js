// Required Modules
import axios from 'axios'

// Server
const server = {
  deploy({ is_public, version }) {
    return axios({
      method: 'post',
      url: `${process.env.API_URL}/deploy`,
      headers: {
        Authorization: process.env.API_KEY
      },
      data: {
        app_name: process.env.APP_NAME,
        version_name: `v${version}`,
        env_vars: [
          {
            key: 'LOBBY_SERVER_URL',
            value: process.env.LOBBY_SERVER_URL,
            is_hidden: false
          }
        ],
        skip_telemetry: true,
        tags: [
          `${process.env.REGION}`,
          `${is_public ? 'public' : 'private'}`,
          `v${version}`
        ],
        location: {
          latitude: parseInt(process.env.LATITUDE),
          longitude: parseInt(process.env.LONGITUDE)
        }
      }
    })
  },
  status(request_id) {
    return axios({
      method: 'get',
      url: `${process.env.api_url}/status/${request_id}`,
      headers: {
        Authorization: process.env.API_KEY
      }
    })
  },
  delete(request_id) {
    return axios({
      method: 'delete',
      url: `${process.env.api_url}/stop/${request_id}`,
      headers: {
        Authorization: process.env.API_KEY
      }
    })
  },
  list({ page }) {
    return axios({
      method: 'get',
      url: `${process.env.api_url}/deployments?query={"filters":[{"field":"tags","operator":"eq","value":"${process.env.REGION}"}]}&page=${page}&limit=100`,
      headers: {
        Authorization: process.env.API_KEY
      }
    })
  }
}

export default server
