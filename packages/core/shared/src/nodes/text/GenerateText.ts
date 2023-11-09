// DOCUMENTED
import Rete from '@magickml/rete'
import { DropdownControl } from '../../dataControls/DropdownControl'
import { MagickComponent } from '../../engine'
import { pluginManager } from '../../plugin'
import { triggerSocket } from '../../sockets'
import {
  CompletionInspectorControls,
  CompletionProvider,
  CompletionSocket,
  EngineContext,
  MagickNode,
  MagickWorkerInputs,
  MagickWorkerOutputs,
  WorkerData,
} from '../../types'
import { InputControl } from '../../dataControls/InputControl'

/** Information related to the GenerateText */
const info =
  'Takes a string input and generates an AI text completion which is output as a string. The Model Name property lets you select between the various text completion models that have been integrated into Magick. Changing the model name will provide relevant properties for the model such as Temperature and Top P (explanations of which can be found online). The GPT 3.5 Turbo and GPT-4 models have optional System Directive and Conversation properties. The System Directive is a string that describes how the chat completion model should behave and the Conversations property allows you to pass in an array of previous chat messages for the model to use as short-term memory. The conversation array can be generated by using the Events to Conversation node.'

/** Type definition for the worker return */
type WorkerReturn = {
  result?: string
}

/**
 * GenerateText component responsible for generating text using any providers
 * available in Magick.
 */
export class GenerateText extends MagickComponent<Promise<WorkerReturn>> {
  constructor() {
    super(
      'Generate Text',
      {
        outputs: {
          result: 'output',
          trigger: 'option',
        },
      },
      'AI/LLM',
      info
    )

    this.common = true
  }

  /**
   * Builder for generating text.
   * @param node - the MagickNode instance.
   * @returns a configured node with data generated from providers.
   */
  builder(node: MagickNode) {
    const dataInput = new Rete.Input('trigger', 'Trigger', triggerSocket, true)
    const dataOutput = new Rete.Output('trigger', 'Trigger', triggerSocket)

    // get completion providers for text and chat categories
    const completionProviders = pluginManager.getCompletionProviders('text', [
      'text',
      'chat',
    ]) as CompletionProvider[]

    // get the models from the completion providers and flatten into a single array
    const models = completionProviders.map(provider => provider.models).flat()

    const modelName = new DropdownControl({
      name: 'Model Name',
      dataKey: 'model',
      values: models,
      defaultValue: models[0],
      tooltip: 'Choose model name',
    })

    const customModel = new InputControl({
      name: 'Custom OpenAI Model',
      dataKey: 'customModel',
      defaultValue: '',
      tooltip:
        'Use to use a custom Open AI model.  Will override the model dropdown. You need an API key for your service.',
    })

    node.inspector.add(modelName).add(customModel)

    node.addInput(dataInput).addOutput(dataOutput)

    let lastInputSockets: CompletionSocket[] | undefined = []
    let lastOutputSockets: CompletionSocket[] | undefined = []
    let lastInspectorControls: CompletionInspectorControls[] | undefined = []

    /**
     * Configure the provided node according to the selected model and provider.
     */
    const configureNode = () => {
      const model = node.data.model as string
      const provider = completionProviders.find(provider =>
        provider.models.includes(model)
      ) as CompletionProvider
      const inspectorControls = provider.inspectorControls
      const inputSockets = provider.inputs
      const outputSockets = provider.outputs
      const connections = node.getConnections()

      // update inspector controls
      if (inspectorControls !== lastInspectorControls) {
        lastInspectorControls?.forEach(control => {
          node.inspector.dataControls.delete(control.dataKey)
        })
        inspectorControls?.forEach(control => {
          const _control = new control.type(control)
          node.inspector.add(_control)
        })
        lastInspectorControls = inspectorControls
      }
      // update input sockets
      if (inputSockets !== lastInputSockets) {
        lastInputSockets?.forEach(socket => {
          if (node.inputs.has(socket.socket)) {
            connections.forEach(c => {
              if (c.input.key === socket.socket)
                this.editor?.removeConnection(c)
            })

            node.inputs.delete(socket.socket)
          }
        })
        inputSockets.forEach(socket => {
          node.addInput(new Rete.Input(socket.socket, socket.name, socket.type))
        })
        lastInputSockets = inputSockets
      }
      // update output sockets
      if (outputSockets !== lastOutputSockets) {
        lastOutputSockets?.forEach(socket => {
          if (node.outputs.has(socket.socket))
            node.outputs.delete(socket.socket)
        })
        outputSockets.forEach(socket => {
          node.addOutput(
            new Rete.Output(socket.socket, socket.name, socket.type)
          )
        })
        lastOutputSockets = outputSockets
      }
    }

    modelName.onData = (value: string) => {
      node.data.model = value
      configureNode()
    }

    if (!node.data.model) node.data.model = models[0]
    configureNode()
    return node
  }

  /**
   * Worker for processing the generated text.
   * @param node - the worker data.
   * @param inputs - worker inputs.
   * @param outputs - worker outputs.
   * @param context - engine context.
   * @returns an object with the success status and result or error message.
   */
  async worker(
    node: WorkerData,
    inputs: MagickWorkerInputs,
    outputs: MagickWorkerOutputs,
    context: {
      module: unknown
      secrets: Record<string, string>
      projectId: string
      context: EngineContext
    }
  ) {
    // get completion providers for text and chat categories
    const completionProviders = pluginManager.getCompletionProviders('text', [
      'text',
      'chat',
    ]) as CompletionProvider[]

    const model = (node.data as { model: string }).model as string
    const customModel = node.data.customModel as string | undefined

    // get the provider for the selected model
    const provider = completionProviders.find(provider =>
      provider.models.includes(model)
    ) as CompletionProvider
    const completionHandler = provider.handler

    if (!completionHandler) {
      console.error('No completion handler found for provider', provider)
      throw new Error('ERROR: Completion handler undefined')
    }

    // check if custom model and regex check for word fine-tune in model
    if (customModel && customModel.length > 0) {
      node.data.customModel = customModel
    }

    const { success, result, error } = await completionHandler({
      node,
      inputs,
      outputs,
      context,
    })
    console.log('result', result)
    if (!success) {
      throw new Error('ERROR: ' + error)
    }

    return {
      result: result as string,
    }
  }
}
