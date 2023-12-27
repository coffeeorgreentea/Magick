import {
  DockviewApi,
  DockviewDropEvent,
  DockviewReact,
  DockviewReadyEvent,

  IDockviewPanelProps,
  positionToDirection,
} from 'dockview'
import { useEffect, useRef, useState } from 'react'
import { Tab, useConfig } from '@magickml/providers';
import { usePubSub } from '@magickml/providers'
import EventHandler from '../../EventHandler/EventHandler'

import Console from '../../DebugConsole'
import TextEditor from '../../TextEditorWindow'
import ChatWindow from '../../ChatWindow/ChatWindow'
import { PropertiesWindow } from '../../PropertiesWindow/PropertiesWindow'
import GraphWindow from '../../GraphWindow/GraphWindow'
import { useSelector } from 'react-redux';
import { RootState } from 'client/state';

const generateLayoutKey = (spellid: string, agentId: string, projectId: string,) => {
  return `${projectId}/composer_layout_${spellid}/${agentId || 'draft-agent'}`
}

const getLayoutFromLocalStorage = (spellId: string, currentAgentId: string | undefined, projectId: string) => {
  const key = generateLayoutKey(spellId, currentAgentId, projectId)
  const layout = localStorage.getItem(key)
  return layout ? JSON.parse(layout) : null
}

const saveLayoutToLocalStorage = (spellId: string, currentAgentId: string | undefined, projectId: string, layout: any) => {
  const key = generateLayoutKey(spellId, currentAgentId, projectId)
  localStorage.setItem(key, JSON.stringify(layout))
}

function loadDefaultLayout(api: DockviewApi, tab, spellId) {
  const panel = api.addPanel({
    id: 'panel_1',
    component: 'default',
    params: {
      title: 'Panel 1',
    },
  })

  panel.group.locked = true
  panel.group.header.hidden = true

  api.addPanel({
    id: 'Graph',
    component: 'Graph',
    params: {
      title: 'Graph',
      tab,
      spellId
    },
  })

  api
    .addPanel({
      id: 'Properties',
      component: 'Properties',
      params: {
        title: 'Properties',
        tab,
        spellId
      },

      position: { referencePanel: 'Graph', direction: 'left' },
    })
    .api.setSize({
      width: 300,
    })

  api.addPanel({
    id: 'Text Editor',
    component: 'TextEditor',
    params: {
      title: 'Text Editor',
      tab,
      spellId
    },
    position: { referencePanel: 'Properties', direction: 'below' },
  })

  // panel5.group!.model.header.hidden = true;
  // panel5.group!.model.locked = true;

  api
    .addPanel({
      id: 'Chat',
      component: 'Chat',
      params: {
        title: 'Chat',
        tab,
        spellId
      },
      position: { referencePanel: 'Graph', direction: 'below' },
    })
    .api.setSize({
      height: 300,
    })

  api.addPanel({
    id: 'Console',
    component: 'Console',
    params: {
      title: 'Console',
      tab,
      spellId
    },
    position: { referencePanel: 'Chat', direction: 'right' },
  })
}

const components = {
  default: (props: IDockviewPanelProps<{ title: string, spellId: string }>) => {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        {props.params.title}
      </div>
    )
  },
  Chat: (props: IDockviewPanelProps<{ tab: Tab, spellId: string }>) => {
    return <ChatWindow {...props.params} />
  },
  Properties: (props: IDockviewPanelProps<{ tab: Tab, spellId: string }>) => {
    return <PropertiesWindow {...props.params} />
  },
  TextEditor: (props: IDockviewPanelProps<{ tab: Tab, spellId: string }>) => {
    return <TextEditor {...props.params} />
  },
  Graph: GraphWindow,
  Console: (props: IDockviewPanelProps<{ tab: Tab, spellId: string }>) => {
    return <Console {...props.params} />
  },
  // AgentControls
}

export const Composer = ({ tab, theme, spellId }) => {
  const pubSub = usePubSub()
  const config = useConfig()
  const [api, setApi] = useState<DockviewApi>(null)
  const { events, subscribe } = usePubSub()

  const globalConfig = useSelector((state: RootState) => state.globalConfig)
  const { currentAgentId: _currentAgentId } = globalConfig
  const currentAgentRef = useRef(_currentAgentId)

  useEffect(() => {
    currentAgentRef.current = _currentAgentId
  }, [_currentAgentId])


  const onReady = (event: DockviewReadyEvent) => {
    // const layout = tab.layoutJson;
    const layout = getLayoutFromLocalStorage(spellId, currentAgentRef.current, config.projectId)

    let success = false;

    if (layout) {
      event.api.fromJSON(layout);
      success = true;
    }

    if (!success) {
      loadDefaultLayout(event.api, tab, spellId)
    }

    setApi(event.api)
  }

  useEffect(() => {
    if (!api) return

    const unsubscribe = subscribe(events.$CREATE_TEXT_EDITOR(tab.id), () => {
      api.addPanel({
        id: 'Text Editor',
        component: 'TextEditor',
        params: {
          title: 'Text Editor',
          tab,
          spellId
        },
      })
    })

    api.onDidLayoutChange(() => {
      const layout = api.toJSON()

      saveLayoutToLocalStorage(spellId, currentAgentRef.current, config.projectId, layout)
    })

    return () => {
      unsubscribe()
    }
  }, [api])

  const onDidDrop = (event: DockviewDropEvent) => {
    const component = event.nativeEvent.dataTransfer.getData('component')
    const title = event.nativeEvent.dataTransfer.getData('title')
    event.api.addPanel({
      id: component,
      component: component,
      position: {
        direction: positionToDirection(event.position),
        referenceGroup: event.group || undefined,
      },
      params: {
        title: title ? title : component,
        tab,
        spellId
      }
    });
  };

  const showDndOverlay = () => {
    return true;
  };

  return (
    <>
      <EventHandler tab={tab} pubSub={pubSub} spellId={spellId} />
      <DockviewReact
        onDidDrop={onDidDrop}
        components={components}
        onReady={onReady}
        className={theme}
        showDndOverlay={showDndOverlay}
      />
    </>
  )
}