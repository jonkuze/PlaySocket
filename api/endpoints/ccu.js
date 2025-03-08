// Required Modules
import { actions } from '../../wss/modules/store.js'

// CCU Module
const ccu = {
  async get(request, response) {
    // Init Request
    async function init() {
      try {
        // Get CCU
        const ccu = actions.getCCU()
        
        // Send Success Response
        sendSuccess({ ccu })
      } catch (error) {
        // Send Error Response
        sendError(error)
      }
    }
  
    // Send Success Response
    function sendSuccess(payload) {
      response.status(200).send(payload)
    }
  
    // Send Error Response
    function sendError(error) {
      response.sendStatus(400).send(error.message)
    }
  
    // Init Request
    init()
  }
}


export default ccu