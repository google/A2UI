import { EventNode, EventNodeProps } from 'motia/workbench'
import React from 'react'

/**
 * UI Step Override for GenerateUI Event Step
 * 
 * Custom visualization for the LLM-powered UI generation step.
 */
export const Node: React.FC<EventNodeProps> = (props) => {
  return (
    <EventNode {...props}>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs font-mono text-gray-400">AI Generation</span>
        </div>
        <div className="text-sm text-gray-300">
          LLM-powered component generation
        </div>
        <div className="flex gap-1 mt-1">
          <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded">
            🤖 LLM
          </span>
          <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
            a2ui.llm.request
          </span>
        </div>
      </div>
    </EventNode>
  )
}

