import { config } from 'motia'
import endpointPlugin from '@motiadev/plugin-endpoint/plugin'
import logsPlugin from '@motiadev/plugin-logs/plugin'
import observabilityPlugin from '@motiadev/plugin-observability/plugin'
import statesPlugin from '@motiadev/plugin-states/plugin'
import bullmqPlugin from '@motiadev/plugin-bullmq/plugin'
import cors from 'cors'

/**
 * Motia Configuration for A2UI
 * 
 * A2UI (Agent-to-User Interface) Protocol implementation using Motia.
 * Follows the v0.9 specification for streaming UI generation.
 */
export default config({
  // Use in-memory Redis for development
  redis: {
    useMemoryServer: true,
  },
  plugins: [
    observabilityPlugin,
    statesPlugin,
    endpointPlugin,
    logsPlugin,
    bullmqPlugin,
  ],
  // Enable CORS for demo client
  app: (app) => {
    app.use(cors({ origin: '*' }))
  },
})

