import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config/env'

// The backend authenticates sockets with the same HTTP-only cookie.
export function createSocket() {
  return io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] })
}
