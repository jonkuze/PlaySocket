// Deployment
class Deployment {
  constructor({ id, ip, port, max_ccu, is_public, host_id, version }) {
    this.name = `Server ${Math.floor(Math.random() * 1000)}`,
    this.id = id
    this.ip = `${ip}:${port}`
    this.ccu = 0
    this.max_ccu = max_ccu
    this.capacity = '0%'
    this.is_public = is_public
    this.host_id = host_id
    this.version = version
    this.last_update = Date.now()
  }
}

export default Deployment
