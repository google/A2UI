import { useState, useEffect, useCallback } from 'react';
import { MessageProcessor, A2UISurface, A2UIRoot } from '@a2ui/react';
import type { A2UIClientAction, A2UIAction } from '@a2ui/react';

// Demo 1: Direct rendering with static spec
const directRenderSpec = {
  component: 'Card',
  child: {
    component: 'Column',
    children: [
      { component: 'Text', text: 'Restaurant Finder', usageHint: 'h1' },
      { component: 'Text', text: 'Find the best restaurants near you' },
      {
        component: 'Row',
        children: [
          {
            component: 'TextField',
            placeholder: 'Search cuisine...',
            label: 'Cuisine Type',
          },
          {
            component: 'Button',
            primary: true,
            child: { component: 'Text', text: 'Search' },
            action: { name: 'search' },
          },
        ],
      },
    ],
  },
};

// Demo 2: Streaming protocol messages
function createRestaurantDemoMessages() {
  return [
    {
      type: 'beginRendering' as const,
      surfaceId: 'restaurant-finder',
      root: 'root-card',
    },
    {
      type: 'surfaceUpdate' as const,
      surfaceId: 'restaurant-finder',
      components: [
        { id: 'root-card', component: { Card: { child: 'content-col' } } },
        {
          id: 'content-col',
          component: {
            Column: {
              children: ['title', 'subtitle', 'results-list'],
            },
          },
        },
        {
          id: 'title',
          component: { Text: { text: { path: '/title' }, usageHint: 'h1' } },
        },
        {
          id: 'subtitle',
          component: { Text: { text: { path: '/subtitle' } } },
        },
        {
          id: 'results-list',
          component: {
            List: {
              items: { path: '/restaurants' },
              itemTemplate: {
                id: 'item-card',
                component: {
                  Card: {
                    child: {
                      id: 'item-content',
                      component: {
                        Column: {
                          children: [
                            {
                              id: 'item-name',
                              component: {
                                Text: { text: { path: 'item.name' }, usageHint: 'h3' },
                              },
                            },
                            {
                              id: 'item-cuisine',
                              component: { Text: { text: { path: 'item.cuisine' } } },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
    {
      type: 'dataModelUpdate' as const,
      surfaceId: 'restaurant-finder',
      contents: [
        { key: 'title', valueString: 'Top Restaurants' },
        { key: 'subtitle', valueString: 'Based on your preferences' },
        {
          key: 'restaurants',
          valueMap: [
            {
              key: '0',
              valueMap: [
                { key: 'name', valueString: 'Sakura Sushi' },
                { key: 'cuisine', valueString: 'Japanese' },
              ],
            },
            {
              key: '1',
              valueMap: [
                { key: 'name', valueString: 'Pasta Paradise' },
                { key: 'cuisine', valueString: 'Italian' },
              ],
            },
            {
              key: '2',
              valueMap: [
                { key: 'name', valueString: 'Taco Town' },
                { key: 'cuisine', valueString: 'Mexican' },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function App() {
  const [processor] = useState(() => new MessageProcessor());
  const [activeTab, setActiveTab] = useState<'direct' | 'streaming'>('direct');
  const [streamingReady, setStreamingReady] = useState(false);

  // Initialize streaming demo
  useEffect(() => {
    if (activeTab === 'streaming' && !streamingReady) {
      const messages = createRestaurantDemoMessages();
      messages.forEach((msg) => processor.processMessage(msg));
      setStreamingReady(true);
    }
  }, [activeTab, streamingReady, processor]);

  const handleDirectAction = useCallback((action: A2UIAction) => {
    console.log('Direct rendering action:', action);
    alert(`Action: ${action.name || action.action}`);
  }, []);

  const handleStreamingAction = useCallback((action: A2UIClientAction) => {
    console.log('Streaming action:', action);
    alert(`Action: ${action.action.name}`);
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>A2UI React Sample</h1>
      <p>Demonstrating both direct rendering and streaming protocol modes.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('direct')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'direct' ? '#1976d2' : '#e0e0e0',
            color: activeTab === 'direct' ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Direct Rendering
        </button>
        <button
          onClick={() => setActiveTab('streaming')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'streaming' ? '#1976d2' : '#e0e0e0',
            color: activeTab === 'streaming' ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Streaming Protocol
        </button>
      </div>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16 }}>
        {activeTab === 'direct' ? (
          <>
            <h2>Direct Rendering Mode</h2>
            <p style={{ color: '#666', marginBottom: 16 }}>
              Renders A2UI specs directly without the streaming protocol.
            </p>
            <A2UIRoot spec={directRenderSpec} data={{}} onAction={handleDirectAction} />
          </>
        ) : (
          <>
            <h2>Streaming Protocol Mode</h2>
            <p style={{ color: '#666', marginBottom: 16 }}>
              Uses MessageProcessor to handle A2UI protocol messages with data binding.
            </p>
            <A2UISurface
              surfaceId="restaurant-finder"
              processor={processor}
              onAction={handleStreamingAction}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
