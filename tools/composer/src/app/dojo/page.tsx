'use client';

import React, { useState } from 'react';
import { Play, Pause, SkipBack, FastForward, Settings, FileJson, LayoutTemplate } from 'lucide-react';
import { useJsonlPlayer } from '@/components/dojo/useJsonlPlayer';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { scenarios, ScenarioId } from '@/data/dojo';

export default function DojoPage() {
  const [activeTab, setActiveTab] = useState<'data' | 'config'>('data');
  const [renderers, setRenderers] = useState({ react: true, lit: false, discord: true });
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('kitchen-sink');

  const {
    playbackState,
    progress,
    totalMessages,
    speed,
    activeMessages,
    play,
    pause,
    stop,
    seek,
    setSpeed
  } = useJsonlPlayer({
    messages: (scenarios[selectedScenario] as any) || [],
    autoPlay: false,
    baseIntervalMs: 1000
  });

  const toggleTab = () => setActiveTab((prev) => (prev === 'data' ? 'config' : 'data'));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top Header / Command Center */}
      <header className="flex h-14 items-center gap-4 border-b px-6 bg-card">
        {/* Toggle Data / Config */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1 border">
          <Button
            variant={activeTab === 'data' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs px-2 gap-1.5"
            onClick={() => setActiveTab('data')}
          >
            <FileJson className="h-3.5 w-3.5" />
            Data
          </Button>
          <Button
            variant={activeTab === 'config' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs px-2 gap-1.5"
            onClick={() => setActiveTab('config')}
          >
            <Settings className="h-3.5 w-3.5" />
            Config
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Playback Scrubber & Controls */}
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stop}>
              <SkipBack className="h-4 w-4" />
            </Button>
            {playbackState === 'playing' ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={pause}>
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={play}>
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Timeline Scrubber */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4 text-right">{progress + 1}</span>
            <input
              type="range"
              min="0"
              max={Math.max(0, totalMessages - 1)}
              value={progress}
              onChange={(e) => seek(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-muted-foreground w-4">{totalMessages}</span>
          </div>

          {/* Speed Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-mono w-12"
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 0.5 : 1)}
          >
            {speed}x
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Scenario Selection Placeholder */}
        <div className="flex items-center">
          <select 
            className="h-8 text-xs border rounded px-2 outline-none bg-background"
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value as ScenarioId)}
          >
            {Object.keys(scenarios).map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Split Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Left Pane: JSONL Source or Configuration */}
        <ResizablePanel defaultSize={30} minSize={20} className="bg-muted/30">
          <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {activeTab === 'data' ? 'JSONL Stream (SSE)' : 'Renderer Configuration'}
            </h2>
            
            {activeTab === 'data' ? (
              <div className="flex flex-col gap-2">
                {(scenarios[selectedScenario] as any).map((msg: any, index: number) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-md text-xs font-mono border transition-all ${
                      index === progress 
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/20' 
                        : index < progress
                        ? 'bg-card text-foreground opacity-90'
                        : 'bg-card text-muted-foreground opacity-50'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap">{JSON.stringify(msg, null, 2)}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mock Config Toggles */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-medium">Active Surfaces</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={renderers.react} onChange={e => setRenderers(r => ({...r, react: e.target.checked}))} />
                    React Adapter (Web)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={renderers.discord} onChange={e => setRenderers(r => ({...r, discord: e.target.checked}))} />
                    Discord Adapter (Mock)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={renderers.lit} onChange={e => setRenderers(r => ({...r, lit: e.target.checked}))} />
                    Lit Components
                  </label>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-medium">Transport Configuration</h3>
                  <select className="w-full text-sm p-1.5 border rounded bg-background">
                    <option>A2A (Server Sent Events)</option>
                    <option>AG UI (Stream)</option>
                    <option>WebSocket</option>
                    <option>REST Polling</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Pane: Active Renderers */}
        <ResizablePanel defaultSize={70}>
          <div className="h-full flex flex-col bg-background relative overflow-hidden">
            <div className="absolute inset-0 p-4 grid gap-4 grid-flow-col auto-cols-fr">
              
              {renderers.react && (
                <div className="rounded-xl border bg-card flex flex-col shadow-sm overflow-hidden">
                  <div className="h-10 bg-muted/50 border-b flex items-center px-4">
                    <span className="text-xs font-semibold text-muted-foreground">React Renderer</span>
                  </div>
                  <div className="flex-1 p-6 flex flex-col items-center justify-center">
                    {/* Placeholder for real React A2UI Renderer component */}
                    <div className="text-sm text-center border-2 border-dashed border-primary/20 rounded-xl p-8 bg-primary/5 w-full">
                      <p className="font-mono text-primary/80 mb-2">{'<A2UIRenderer />'}</p>
                      <p className="text-muted-foreground">Currently displaying {activeMessages.length} elements</p>
                    </div>
                  </div>
                </div>
              )}

              {renderers.discord && (
                <div className="rounded-xl border bg-[#313338] text-white flex flex-col shadow-sm overflow-hidden">
                  <div className="h-10 bg-[#2B2D31] border-b border-black/20 flex items-center px-4">
                    <span className="text-xs font-semibold text-white/50">Discord Renderer (Adapter)</span>
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    {/* Mock Discord UI */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#5865F2] flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-[15px]">Agent</span>
                          <span className="text-xs text-white/40">Today at 4:20 PM</span>
                        </div>
                        <div className="bg-[#2B2D31] border-l-4 border-[#5865F2] rounded p-4 text-sm">
                          <p className="text-white/90">Simulated Discord embed updating via {activeMessages.length} states.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}
