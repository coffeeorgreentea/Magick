// DOCUMENTED
import { SpellManager } from '@magickml/core'

/**
 * Handle socket connections for the application.
 * @param {any} app - The application instance.
 * @returns {(io: any) => void} - A function that takes an `io` instance and sets up socket connections.
 */
const handleSockets = (app: any) => {
  const logger = app.get('logger')
  return (io: any) => {
    /**
     * Set up a connection event listener for incoming sockets.
     */
    io.on('connection', async function (socket: any) {
      logger.debug('Socket connected', socket.id)
      //   // Use a custom header for the handshake.
      let token = socket?.handshake?.query?.token

      if (!token) {
        // check for token in auth header
        const rawToken = socket?.handshake?.headers?.authorization

        // parse token
        if (rawToken) {
          token = rawToken.split(' ')[1]
        }

        if (!token)
          return logger.error(
            'No token provided in handshake query. Socket connection failed.'
          )

        socket.emit('auth_error', 'Authentication failed. No token provided.')
        return
      }

      try {
        // Auth services will verify the token
        const payload = await app
          .service('authentication')
          .verifyAccessToken(token)

        logger.debug(
          `Socket connection for user ${payload.user.id}: %o`,
          payload
        )

        const user = payload.user
        // Attach the user info to the params for use in services
        socket.feathers.user = user
        if (payload.sessionId) socket.feathers.sessionId = payload.sessionId

        // Instantiate the interface within the runner rather than the spell manager to avoid shared state issues.
        const spellManager = new SpellManager({
          socket,
          app,
          watchSpells: true,
        })
        app.userSpellManagers.set(user.id, spellManager)
        // emit login event to be handled by global app login methods for channels
        logger.debug('Emitting login event for connection')
        app.emit('login', payload, { connection: socket.feathers })
        socket.emit('connected')
      } catch (error: any) {
        logger.error('Authentication error: %o', error.message)
        socket.emit('auth_error', 'Authentication failed.')
        return
      }
    })
  }
}

export default handleSockets
