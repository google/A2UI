import { NoopNode, NoopNodeProps } from 'motia/workbench'
import React from 'react'

/**
 * UI Step Override for A2UIFlowStart NOOP Step
 * 
 * Visual entry point for the A2UI protocol in Workbench.
 */
export const Node: React.FC<NoopNodeProps> = (props) => {
  return (
    <NoopNode {...props}>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A2</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">A2UI Protocol</div>
            <div className="text-xs text-gray-400">v0.9 Specification</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Agent-to-User Interface Protocol
        </div>
      </div>
    </NoopNode>
  )
}

