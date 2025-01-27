// DOCUMENTED
import { config } from 'dotenv-flow'
import { importMetaEnv } from './import-meta-env'
import { v4 } from 'uuid'

// Load environment variables
config({
  path: '../../../.env.*',
})

// Check whether "process" is defined or not, and assign the appropriate environment object.
const processEnv = typeof process === 'undefined' ? importMetaEnv : process.env

/**
 * Get an environment variable value for the given key.
 *
 * @param {string} env - The key to search for in environment variables.
 * @returns {string | undefined} - The value associated with the key, or undefined if not found.
 */
function getVarForEnvironment(env: string): string | undefined {
  return (
    processEnv[env] || // Check processEnv for env key
    processEnv[`VITE_APP_${env}`] || // Check VITE prefixed env variables
    processEnv[`NEXT_${env}`] || // Check NEXT prefixed env variables
    processEnv[`REACT_${env}`] // Check REACT prefixed env variables
  )
}

// Define and export constants from environment variables
export const IGNORE_AUTH = getVarForEnvironment('IGNORE_AUTH') === 'true'
export const DATABASE_URL = getVarForEnvironment('DATABASE_URL')
export const DEFAULT_PROJECT_ID =
  getVarForEnvironment('PROJECT_ID') || 'bb1b3d24-84e0-424e-b4f1-57603f307a89'
export const DEFAULT_USER_ID = getVarForEnvironment('USER_ID') || '1234567890'
export const DEFAULT_USER_TOKEN =
  getVarForEnvironment('DUMMY_TOKEN') ||
  'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..SUWUnYMxRTxIgGD1.lCzhMnTVeWOBFBzDs4_ft6UCZIVhfk9VSw18-SNzSJjXB4yqwi7z3XJEO9FwbSybFkAjSoFHwYnizYhDsrouDn1xLS7Dqzwnn4I-V1-L0mXcmKXRAS8D1PQzR88CDsk-LIqkcZkkxQ8aoGmyVcKwAmlnAdYpPUEbJ7E3DEBCvA4UbY1iqdYmCWdD7NWeR_IDsWFMKP3jEqp3HPMJbbTitCb1_W-G0gnZ6cokK_JH9tpgbjAoWe0KRQB2Dr3B22-1qa9cPV8W13she2q_RR6SeTAM9iqwzufvuIu2b3Lu0fypQpcV4JyrwCawkZcjsdGQqateftfAQNYzUeSXVzZdWSZJOwHtDHpIMKh_SugqS3ASNrN2gqUEwvY2SOe60h__2ljLsSc.9qWEv3VNEKFpc6zmJv4n0A'
export const STANDALONE = getVarForEnvironment('STANDALONE') === 'true' || false
export const PRODUCTION = getVarForEnvironment('PRODUCTION') === 'true'
export const DEFAULT_OPENAI_KEY = getVarForEnvironment('DEFAULT_OPENAI_KEY')
export const DEFAULT_GOOGLEAI_API_KEY = getVarForEnvironment(
  'DEFAULT_GOOGLEAI_API_KEY'
)
export const DONT_CRASH_ON_ERROR =
  getVarForEnvironment('DONT_CRASH_ON_ERROR') === 'true'
export const SERVER_PORT = getVarForEnvironment('PORT') || '3030'
export const SERVER_HOST = getVarForEnvironment('HOST') || 'localhost'
export const SPEECH_SERVER_URL =
  getVarForEnvironment('SPEECH_SERVER_URL') || 'http://localhost:65532'
export const TRUSTED_PARENT_URL =
  getVarForEnvironment('TRUSTED_PARENT_URL') || null
export const API_ROOT_URL =
  getVarForEnvironment('API_URL') || `http://localhost:${SERVER_PORT}`
export const GOOGLE_APPLICATION_CREDENTIALS =
  processEnv.GOOGLE_APPLICATION_CREDENTIALS || ''
export const SPEECH_SERVER_PORT =
  getVarForEnvironment('SPEECH_SERVER_PORT') || 65532
export const ENABLE_SPEECH_SERVER =
  getVarForEnvironment('ENABLE_SPEECH_SERVER') || true
export const USSSL_SPEECH = getVarForEnvironment('USSSL_SPEECH') || true
export const FILE_SERVER_PORT =
  getVarForEnvironment('FILE_SERVER_PORT') || 65530
export const FILE_SERVER_URL =
  getVarForEnvironment('FILE_SERVER_URL') || 'https://localhost:65530'
export const USESSL = getVarForEnvironment('USESSL') || false
export const NODE_ENV = getVarForEnvironment('NODE_ENV') || 'development'

export const PAGINATE_DEFAULT = getVarForEnvironment('PAGINATE_DEFAULT') || '10'
export const PAGINATE_MAX = getVarForEnvironment('PAGINATE_MAX') || '100'
export const JWT_SECRET = getVarForEnvironment('JWT_SECRET') || 'secret'

export const POSTHOG_ENABLED =
  getVarForEnvironment('POSTHOG_ENABLED') === 'true'
export const POSTHOG_API_KEY = getVarForEnvironment('POSTHOG_API_KEY') || ''
export const REDISCLOUD_HOST = getVarForEnvironment('REDISCLOUD_HOST') || ''
export const REDISCLOUD_PORT =
  Number(getVarForEnvironment('REDISCLOUD_PORT')) || 6379
export const REDISCLOUD_URL =
  getVarForEnvironment('REDISCLOUD_URL') ||
  `redis://${REDISCLOUD_HOST}:${REDISCLOUD_PORT}`

export const REDISCLOUD_DB = Number(getVarForEnvironment('REDISCLOUD_DB')) || 0
export const REDISCLOUD_PASSWORD = getVarForEnvironment('REDISCLOUD_PASSWORD')
export const REDISCLOUD_USERNAME = getVarForEnvironment('REDISCLOUD_USERNAME')

export const ELEVENLABS_API_KEY =
  getVarForEnvironment('ELEVENLABS_API_KEY') ||
  'ce69df07b50e7179cbbfc5c2bef9d752'
export const VITE_APP_TRUSTED_PARENT_URL =
  getVarForEnvironment('VITE_APP_TRUSTED_PARENT_URL') || ''

export const AGENT_UPDATE_TIME_MSEC = Number(
  getVarForEnvironment('AGENT_UPDATE_TIME_MSEC') || 3000
)
export const PING_AGENT_TIME_MSEC = Number(
  getVarForEnvironment('PING_AGENT_TIME_MSEC') || 6000
)

export const bullMQConnection = {
  host: REDISCLOUD_HOST,
  port: REDISCLOUD_PORT,
  password: REDISCLOUD_PASSWORD,
  username: REDISCLOUD_USERNAME,
  db: REDISCLOUD_DB,
}

export const PINO_LOG_LEVEL = getVarForEnvironment('PINO_LOG_LEVEL') || 'info'

export const OPENMETER_ENDPOINT =
  getVarForEnvironment('OPENMETER_ENDPOINT') || 'http://localhost:8888'

export const OPENMETER_ENABLED =
  getVarForEnvironment('OPENMETER_ENABLED') === 'true'

export const OPENMETER_TOKEN = getVarForEnvironment('OPENMETER_TOKEN') || ''

export const OPENMETER_SOURCE =
  getVarForEnvironment('OPENMETER_SOURCE') || 'cloud-dev'

export const AGENT_RESPONSE_TIMEOUT_MSEC =
  Number(getVarForEnvironment('AGENT_RESPONSE_TIMEOUT_MSEC')) || 120000

export const CLOUD_AGENT_KEY = getVarForEnvironment('CLOUD_AGENT_KEY') || v4()

export const BACKOFF_RETRY_LIMIT = Number(
  getVarForEnvironment('BACKOFF_RETRY_LIMIT') || 0
)

export const AWS_ACCESS_KEY = getVarForEnvironment('AWS_ACCESS_KEY') || ''
export const AWS_SECRET_KEY = getVarForEnvironment('AWS_SECRET_KEY') || ''
export const AWS_REGION = getVarForEnvironment('AWS_REGION') || ''
export const AWS_BUCKET_NAME = getVarForEnvironment('AWS_BUCKET_NAME') || ''
export const AWS_BUCKET_ENDPOINT =
  getVarForEnvironment('AWS_BUCKET_ENDPOINT') || ''

// Feature flags
export const FEATURE_FLAGS = {
  // Enable the new editor
  SHOW_SIDEBAR: getVarForEnvironment('SHOW_SIDEBAR') === 'true' || false,
}

export const HEARTBEAT_MSEC =
  Number(getVarForEnvironment('HEARTBEAT_MSEC')) || 3000
export const MANAGER_WARM_UP_MSEC =
  Number(getVarForEnvironment('MANAGER_WARM_UP_MSEC')) || 5000

export const API_ACCESS_KEY = getVarForEnvironment('API_ACCESS_KEY') || 'apiKey'

export const SPELLRUNNER_BUSY_TIMEOUT_MSEC = getVarForEnvironment(
  'SPELLRUNNER_BUSY_TIMEOUT_MS'
)
  ? Number(getVarForEnvironment('SPELLRUNNER_BUSY_TIMEOUT_MS'))
  : 120000
