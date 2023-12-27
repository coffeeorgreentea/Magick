import { Worker, Job } from 'bullmq'
import { getLogger } from 'server/logger'
import { Application, app } from 'server/core'

import { BullMQWorker, BullQueue } from 'server/communication'

import { Agent, type AgentRunJob } from 'server/agents'
import { v4 as uuidv4 } from 'uuid'
import {
  AGENT_DELETE,
  AGENT_DELETE_JOB,
  AGENT_RUN_JOB,
  AGENT_UPDATE_JOB,
} from 'shared/core'
import { type RedisPubSub } from 'server/redis-pubsub'
import pino from 'pino'

export interface AgentListRecord {
  id: string
  currentAgents: string[]
}

// I get that it's confusing extending AgentManager, but it's the best way to
// get the functionality I want without having to rewrite a bunch of stuff.
// Agent Managers just managed agents for a single instance of the server anyway
export class CloudAgentWorker {
  pubSub: RedisPubSub
  subscriptions: Record<string, Function> = {}
  logger: pino.Logger = getLogger()
  currentAgents: string[] = []
  addHandlers: any = []
  removeHandlers: any = []
  app: Application

  constructor(app: Application) {
    this.app = app
    this.pubSub = app.get('pubsub')

    this.pubSub.subscribe(AGENT_DELETE, async (agentId: string) => {
      this.logger.info(
        `Agent ${agentId} deleted, removing from cloud agent worker`
      )
      await this.removeAgent(agentId)
    })

    this.pubSub.subscribe('heartbeat-ping', async () => {
      this.logger.trace('Got heartbeat ping')
      const agentIds = Object.keys(this.currentAgents)
      this.pubSub.publish('heartbeat-pong', JSON.stringify(agentIds))
    })

    this.addAgent = this.addAgent.bind(this)
  }

  heartbeat() {
    this.pubSub.subscribe('cloud-agents:ping', async () => {
      this.pubSub.publish(
        'cloud-agents:pong',
        JSON.stringify({
          id: uuidv4(),
          currentAgents: Object.keys(this.currentAgents),
        })
      )
    })
  }

  getAgent(agentId: string) {
    return this.currentAgents[agentId]
  }

  async addAgent(agentId: string) {
    this.logger.info(`Creating agent ${agentId}...`)
    const agentDBRes = await app.service('agents').find({
      query: {
        id: agentId,
      },
    })

    const agentDBResult = Array.isArray(agentDBRes)
      ? agentDBRes
      : agentDBRes?.data

    if (agentDBResult.length == 0 || !agentDBResult) {
      this.logger.error(`Agent ${agentId} not found when creating agent`)
      throw new Error(`Agent ${agentId} not found when creating agent`)
    }

    const agentData = {
      ...agentDBResult[0],
      pingedAt: new Date().toISOString(),
    }

    if (!agentData.enabled) {
      this.logger.info(`Agent ${agentId} is disabled, skipping creation`)
      return
    }

    const agent = new Agent(
      agentData,
      this,
      new BullMQWorker(this.app.get('redis')),
      this.app.get('pubsub'),
      app
    )

    const agentQueue = new BullQueue(this.app.get('redis'))
    agentQueue.initialize(AGENT_RUN_JOB(agent.id))
    this.listenForRun(agent.id)
    this.listenForChanges(agentId)

    this.logger.debug(`Running agent add handlers for ${agentId}`)
    this.addHandlers.forEach(handler => {
      handler({ agent, agentData })
    })

    this.currentAgents[agentId] = agent
    this.logger.debug(`Finished running agent add handlers for ${agentId}`)

    this.logger.info(`Updated agent ${agentId}`)
  }

  /**
   * Register a handler to be called when an agent is added.
   * @param handler - The handler function to be called.
   */
  registerAddAgentHandler(handler) {
    this.logger.debug('Registering add agent handler')
    this.addHandlers.push(handler)
  }
  /**
   * Register a handler to be called when an agent is removed.
   * @param handler - The handler function to be called.
   */
  registerRemoveAgentHandler(handler) {
    this.logger.debug('Registering remove agent handler')
    this.removeHandlers.push(handler)
  }

  async removeAgent(agentId: string) {
    this.logger.info(`Removing agent ${agentId}...`)

    this.removeHandlers.forEach(handler => {
      handler({ agent: this.currentAgents[agentId] })
    })

    await this.currentAgents[agentId]?.onDestroy()
    this.currentAgents[agentId] = null

    this.pubSub.unsubscribe(AGENT_UPDATE_JOB(agentId))
    this.pubSub.unsubscribe(AGENT_RUN_JOB(agentId))
  }

  async agentUpdated(agentId: string) {
    this.logger.info(`Updating agent ${agentId}`)
    const agentDBRes = await app.service('agents').find({
      query: {
        id: agentId,
      },
    })

    const agentDBResult = Array.isArray(agentDBRes)
      ? agentDBRes
      : agentDBRes?.data

    if (agentDBResult.length == 0 || !agentDBResult) {
      this.logger.error(`Agent ${agentId} not found when updating agent`)
      throw new Error(`Agent ${agentId} not found when updating agent`)
    }

    const agent = agentDBResult[0]

    // start or stop the agent if the enabled state changed
    if (agent.enabled && !this.currentAgents[agentId]) {
      await this.addAgent(agentId)
    }
    if (!agent.enabled && this.currentAgents[agentId]) {
      await this.removeAgent(agentId)
    }

    // update the agent's rootSpellId if it changed
    // we may want to make this updating flow more robust in the future
    if (
      this.currentAgents[agentId] &&
      agent.rootSpellId != this.currentAgents[agentId].rootSpellId
    ) {
      this.currentAgents[agentId].rootSpellId = agent.rootSpellId
    }

    if (this.currentAgents[agentId]) {
      this.currentAgents[agentId].update(agent)
    }
  }

  async listenForRun(agentId: string) {
    this.logger.debug(`Listening for run for agent ${agentId}`)
    this.logger.debug(AGENT_RUN_JOB(agentId))
    this.pubSub.subscribe(AGENT_RUN_JOB(agentId), async (data: AgentRunJob) => {
      this.logger.info(
        `Running spell ${data.spellId} for agent ${data.agentId}`
      )
      try {
        const agent = this.currentAgents[agentId] as Agent

        if (!agent) {
          this.logger.error(
            `Agent ${agentId} not found when running spell ${data.spellId}`
          )
          throw new Error(
            `Agent ${agentId} not found when running spell ${data.spellId}`
          )
        }

        agent?.runWorker({ data: { ...data, agentId } })
      } catch (e) {
        this.logger.error(
          `Error loading or running spell ${data.spellId} for agent ${data.agentId}`
        )
        throw e
      }
    })
  }

  async listenForChanges(agentId: string) {
    this.pubSub.subscribe(AGENT_UPDATE_JOB(agentId), async () => {
      this.logger.info(`Agent ${agentId} updated, updating agent`)
      await this.agentUpdated(agentId)
    })
    this.pubSub.subscribe(AGENT_DELETE_JOB(agentId), async () => {
      this.logger.info(`Agent ${agentId} updated, updating agent`)
      this.removeAgent(agentId)
    })
  }

  async startWork() {
    this.logger.info('waiting for jobs')

    const redis = app.get('redis')

    await redis.sadd('agent-workers', 'me')

    new Worker(
      'agent:new',
      async (job: Job) => {
        this.logger.info(`Starting agent ${job.data.agentId}`)
        await this.agentUpdated(job.data.agentId)
      },
      {
        connection: app.get('redis'),
      }
    )
  }
}