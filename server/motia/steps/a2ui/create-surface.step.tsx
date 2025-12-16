import { ApiNode, ApiNodeProps } from 'motia/workbench'
import React from 'react'

/**
 * UI Step Override for CreateSurface API Step
 * 
 * Custom visualization for the surface creation step in Motia Workbench.
 */
export const Node: React.FC<ApiNodeProps> = (props) => {
  return (
    <ApiNode {...props}>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono text-gray-400">A2UI Surface</span>
        </div>
        <div className="text-sm text-gray-300">
          Creates a new rendering surface
        </div>
        <div className="flex gap-1 mt-1">
          <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
            POST
          </span>
          <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded font-mono">
            /a2ui/surfaces
          </span>
        </div>
      </div>
    </ApiNode>
  )
}

