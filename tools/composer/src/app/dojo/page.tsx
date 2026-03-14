'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, Settings, FileJson, 
  ChevronDown, Activity, Code2, CheckSquare,
  MessageSquare, Zap, LayoutTemplate
} from 'lucide-react';
import { useJsonlPlayer } from '@/components/dojo/useJsonlPlayer';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  // Auto-scroll logic for the JSONL pane
  const streamEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (playbackState === 'playing' && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [progress, playbackState]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Top Header / Command Center */}
      <header className="relative z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
        
        {/* Left Section: Tab Toggle */}
        <div className="flex w-64 items-center gap-1 rounded-xl bg-muted/50 p-1 shadow-inner border border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 h-8 text-xs font-medium px-3 gap-2 rounded-lg transition-all ${
              activeTab === 'data' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('data')}
          >
            <FileJson className="h-4 w-4" />
            Stream Data
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 h-8 text-xs font-medium px-3 gap-2 rounded-lg transition-all ${
              activeTab === 'config' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('config')}
          >
            <Settings className="h-4 w-4" />
            Config
          </Button>
        </div>

        {/* Center Section: Playback Controls */}
        <div className="flex flex-1 max-w-2xl items-center gap-6 px-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50 shadow-sm" onClick={stop}>
              <SkipBack className="h-4 w-4 text-muted-foreground" />
            </Button>
            {playbackState === 'playing' ? (
              <Button variant="default" size="icon" className="h-10 w-10 rounded-full shadow-md hover:scale-105 transition-transform" onClick={pause}>
                <Pause className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="default" size="icon" className="h-10 w-10 rounded-full shadow-md hover:scale-105 transition-transform bg-primary" onClick={play}>
                <Play className="h-5 w-5 ml-1" />
              </Button>
            )}
          </div>

          {/* Timeline Scrubber */}
          <div className="flex-1 flex items-center gap-4 group">
            <span className="text-xs font-medium text-muted-foreground w-6 text-right tabular-nums">{progress + 1}</span>
            <div className="relative flex-1 flex items-center h-5">
              <input
                type="range"
                min="0"
                max={Math.max(0, totalMessages - 1)}
                value={progress}
                onChange={(e) => seek(parseInt(e.target.value, 10))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              {/* Custom Range Track */}
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${totalMessages > 1 ? (progress / (totalMessages - 1)) * 100 : 0}%` }}
                />
              </div>
              {/* Custom Range Thumb */}
              <div 
                className="absolute h-3 w-3 bg-primary rounded-full shadow-sm shadow-primary/40 border border-background transition-transform group-hover:scale-125 duration-200 ease-out pointer-events-none"
                style={{ 
                  left: `calc(${totalMessages > 1 ? (progress / (totalMessages - 1)) * 100 : 0}% - 6px)`
                }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground w-6 tabular-nums">{totalMessages}</span>
          </div>

          {/* Speed Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-14 text-xs font-mono font-medium rounded-full border-border/50 shadow-sm"
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 0.5 : 1)}
          >
            {speed}x
          </Button>
        </div>

        {/* Right Section: Scenario Selection */}
        <div className="flex w-64 items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-between border-border/50 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground font-medium">
                <div className="flex items-center gap-2 truncate">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="truncate">{selectedScenario}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px] shadow-lg rounded-xl border-border/50">
              {Object.keys(scenarios).map(id => (
                <DropdownMenuItem 
                  key={id} 
                  onClick={() => { setSelectedScenario(id as ScenarioId); stop(); }}
                  className={`text-sm py-2 cursor-pointer ${selectedScenario === id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                >
                  {id}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Split Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Left Pane: JSONL Source or Configuration */}
        <ResizablePanel defaultSize={28} minSize={20} maxSize={40} className="bg-muted/20 border-r border-border/50">
          <div className="h-full flex flex-col relative">
            <div className="absolute inset-0 overflow-y-auto p-5 custom-scrollbar">
              
              <div className="sticky top-0 z-10 pb-4 bg-gradient-to-b from-muted/20 to-transparent">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {activeTab === 'data' ? (
                    <><Zap className="h-3.5 w-3.5 text-amber-500" /> Event Stream</>
                  ) : (
                    <><Settings className="h-3.5 w-3.5" /> Workspace Config</>
                  )}
                </h2>
              </div>
              
              {activeTab === 'data' ? (
                <div className="flex flex-col gap-3 pb-8">
                  {(scenarios[selectedScenario] as any)?.map((msg: any, index: number) => {
                    const isActive = index === progress;
                    const isPast = index < progress;
                    
                    return (
                      <div 
                        key={msg.id || index} 
                        className={`relative p-3.5 rounded-xl text-[11px] font-mono leading-relaxed transition-all duration-300 ease-out border ${
                          isActive 
                            ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_-3px_rgba(var(--primary),0.1)] ring-1 ring-primary/20 scale-[1.02]' 
                            : isPast
                            ? 'bg-card border-border/50 text-foreground shadow-sm'
                            : 'bg-card/50 border-transparent text-muted-foreground opacity-50'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full animate-pulse" />
                        )}
                        <pre className="whitespace-pre-wrap overflow-x-auto custom-scrollbar-sm">
                          {JSON.stringify(msg, null, 2)}
                        </pre>
                      </div>
                    );
                  })}
                  <div ref={streamEndRef} className="h-2" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Surfaces Config */}
                  <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-primary" /> Active Surfaces
                    </h3>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'react', label: 'React Adapter (Web)', icon: Code2 },
                        { id: 'discord', label: 'Discord Mock', icon: MessageSquare },
                        { id: 'lit', label: 'Lit Components', icon: CheckSquare }
                      ].map(surface => (
                        <label key={surface.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-muted/50 hover:border-border/50 cursor-pointer transition-all group">
                          <div className="relative flex items-center justify-center w-5 h-5">
                            <input 
                              type="checkbox" 
                              className="peer appearance-none w-5 h-5 border-2 border-muted-foreground/30 rounded focus:ring-2 focus:ring-primary/20 focus:outline-none checked:bg-primary checked:border-primary transition-all cursor-pointer"
                              checked={(renderers as any)[surface.id]} 
                              onChange={e => setRenderers(r => ({...r, [surface.id]: e.target.checked}))} 
                            />
                            <CheckSquare className="absolute inset-0 h-5 w-5 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none p-0.5" strokeWidth={3} />
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground/90 group-hover:text-foreground">
                            <surface.icon className="h-4 w-4 text-muted-foreground" />
                            {surface.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Transport Config */}
                  <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" /> Transport layer
                    </h3>
                    <div className="relative">
                      <select className="w-full text-sm p-2.5 pl-3 pr-8 border border-border/50 rounded-lg bg-background appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer">
                        <option>A2A (Server Sent Events)</option>
                        <option>AG UI (Stream)</option>
                        <option>WebSocket</option>
                        <option>REST Polling</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Determines how the mock client receives events from the mock server. Currently simulated in-memory.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors" />

        {/* Right Pane: Active Renderers */}
        <ResizablePanel defaultSize={72}>
          <div className="h-full bg-muted/10 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
              <div className={`grid gap-6 min-h-full ${
                Object.values(renderers).filter(Boolean).length === 1 
                  ? 'grid-cols-1 max-w-4xl mx-auto' 
                  : Object.values(renderers).filter(Boolean).length === 2 
                  ? 'grid-cols-2' 
                  : 'grid-cols-3'
              }`}>
                
                {renderers.react && (
                  <div className="flex flex-col rounded-2xl border border-border/60 bg-background shadow-xl overflow-hidden h-full min-h-[500px] transition-all duration-300 hover:shadow-2xl">
                    <div className="h-11 bg-muted/30 border-b flex items-center px-4 justify-between backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" /> React Web
                      </span>
                      <div className="w-10" /> {/* Balancer */}
                    </div>
                    <div className="flex-1 p-8 flex flex-col items-center justify-center bg-dot-pattern">
                      <div className="w-full max-w-md bg-card border border-border/50 rounded-xl shadow-sm p-8 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <Code2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-sm text-foreground mb-1">{'<A2UIRenderer />'}</p>
                          <p className="text-xs text-muted-foreground">Rendering components via React Adapter</p>
                        </div>
                        <div className="pt-4 border-t border-border/50 mt-4 flex justify-between text-xs text-muted-foreground">
                          <span>State elements:</span>
                          <span className="font-mono font-medium text-foreground">{activeMessages.length}</span>
                        </div>
                        {activeMessages.length > 0 && (
                          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                            <div className="bg-primary h-full animate-pulse w-full rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {renderers.discord && (
                  <div className="flex flex-col rounded-2xl border border-border/60 bg-[#313338] text-white shadow-xl overflow-hidden h-full min-h-[500px] transition-all duration-300 hover:shadow-2xl">
                    <div className="h-11 bg-[#2B2D31] border-b border-black/20 flex items-center px-4 justify-between">
                      <div className="flex items-center gap-2 text-white/50">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold text-white/70 tracking-wide">
                        # a2ui-demo
                      </span>
                      <div className="w-4" /> {/* Balancer */}
                    </div>
                    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar-discord">
                      
                      {/* Mock Discord UI - Start of conversation */}
                      <div className="flex gap-4 opacity-60">
                        <div className="w-10 h-10 rounded-full bg-[#1E1F22] flex-shrink-0 flex items-center justify-center">
                          <span className="text-white/40 text-xs font-bold">U</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-[15px] hover:underline cursor-pointer">User</span>
                            <span className="text-xs text-white/40">Today at 4:20 PM</span>
                          </div>
                          <p className="text-white/90 text-[15px] leading-relaxed">Run the {selectedScenario} scenario.</p>
                        </div>
                      </div>

                      <Separator className="bg-white/5" />

                      {/* Bot Response Mock */}
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#5865F2] flex-shrink-0 flex items-center justify-center shadow-lg">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-[15px] text-[#5865F2] hover:underline cursor-pointer">Agent Bot</span>
                            <span className="bg-[#5865F2] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Bot</span>
                            <span className="text-xs text-white/40 ml-1">Today at 4:20 PM</span>
                          </div>
                          
                          {/* Discord Embed Mock representing active state */}
                          <div className="bg-[#2B2D31] border-l-4 border-[#5865F2] rounded-r-md p-4 text-sm shadow-md mt-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-white/90">A2UI Surface Rendered</span>
                            </div>
                            <p className="text-white/70 mb-4">Simulated embed updating from event stream.</p>
                            
                            <div className="bg-[#1E1F22] rounded border border-white/5 p-3 font-mono text-xs text-white/60">
                              <div className="flex justify-between mb-1">
                                <span>Total events received:</span>
                                <span className="text-white font-bold">{activeMessages.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={playbackState === 'playing' ? 'text-green-400' : 'text-amber-400'}>
                                  {playbackState === 'playing' ? 'Receiving...' : 'Idle'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Mock Discord Buttons */}
                          {activeMessages.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              <button className="bg-[#2B2D31] hover:bg-[#3F4147] transition-colors text-white text-sm font-medium px-4 py-2 rounded shadow-sm border border-transparent">
                                View Details
                              </button>
                              <button className="bg-[#DA373C] hover:bg-[#A12828] transition-colors text-white text-sm font-medium px-4 py-2 rounded shadow-sm border border-transparent">
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {renderers.lit && (
                  <div className="flex flex-col rounded-2xl border border-border/60 bg-background shadow-xl overflow-hidden h-full min-h-[500px] transition-all duration-300 hover:shadow-2xl">
                    <div className="h-11 bg-blue-500/10 border-b border-blue-500/20 flex items-center px-4 justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400/80" />
                      </div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide flex items-center gap-1.5">
                        <LayoutTemplate className="h-3.5 w-3.5" /> Web Components
                      </span>
                      <div className="w-10" />
                    </div>
                    <div className="flex-1 p-8 flex flex-col items-center justify-center bg-blue-50/30 dark:bg-blue-900/10">
                       <div className="w-full max-w-md bg-card border border-blue-500/20 rounded-xl shadow-sm p-8 text-center space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
                        <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                          <LayoutTemplate className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-mono text-sm text-foreground mb-1">{'<a2ui-surface />'}</p>
                          <p className="text-xs text-muted-foreground">Framework-agnostic rendering</p>
                        </div>
                        <div className="pt-4 border-t border-border/50 mt-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${playbackState === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                          {activeMessages.length} states synced
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Global styles for custom scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
        
        .custom-scrollbar-sm::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-sm::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-sm::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 10px; }
        
        .custom-scrollbar-discord::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-discord::-webkit-scrollbar-track { background: #2B2D31; border-radius: 4px; }
        .custom-scrollbar-discord::-webkit-scrollbar-thumb { background: #1A1B1E; border-radius: 4px; }
        
        .bg-dot-pattern {
          background-image: radial-gradient(rgba(156, 163, 175, 0.2) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}} />
    </div>
  );
}
