import pino from 'pino'
import { NODE_ENV, PINO_LOG_LEVEL } from '@magickml/config'

let logger: pino.Logger | null = null

const defaultLoggerOpts = {}

export const initLogger = (opts: object = defaultLoggerOpts) => {
  const baseLoggerOptions = {
    level: PINO_LOG_LEVEL,
    ...opts,
  }

  if (NODE_ENV === 'development') {
    const prettyOptions: {
      target: string
      options: {
        colorize: boolean
        level?: string // You can set a default level here if needed
      }
      level: string // Add this line to specify the logging level
    } = {
      target: 'pino-pretty', // Example target, adjust as necessary
      options: {
        colorize: true,
      },
      level: 'info', // Specify the default logging level here
    }

    logger = pino({
      ...baseLoggerOptions,
      transport: {
        targets: [prettyOptions],
      },
    })
  } else {
    // In production, we simply use the base logger options without pretty print
    logger = pino(baseLoggerOptions)
  }
}

export const getLogger: () => pino.Logger = () => {
  if (logger === null) {
    initLogger()
  }

  return logger as pino.Logger
}
