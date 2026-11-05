/**
 * GET /version → { version: "<package.json version>" }
 * package.json stays the source of truth; it is read once by appInfo.
 */
import { Router } from 'express'
import { getPackageInfo } from '../../utils/appInfo.js'

const router = Router()

router.get('/version', (_req, res) => {
  res.status(200).json({ version: getPackageInfo().version })
})

export default router
