// Required Modules
import { Router } from 'express'
import endpoints from './endpoints/index.js'
const router = Router()

// Get Categories
router.get('/ccu', endpoints.ccu.get)

export default router