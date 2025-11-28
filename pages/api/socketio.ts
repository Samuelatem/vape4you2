import type { NextApiRequest } from 'next'
import { initSocketServer, config as socketConfig, NextApiResponseServerIO } from '@/lib/socket'

export const config = socketConfig

const ioHandler = (_req: NextApiRequest, res: NextApiResponseServerIO) => {
  initSocketServer(res)
  res.end()
}

export default ioHandler