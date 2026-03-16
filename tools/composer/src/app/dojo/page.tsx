'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, Settings, FileJson, 
  ChevronDown, Activity, Code2, CheckSquare,
  Zap, LayoutTemplate
} from 'lucide-react';
import { useJsonlPlayer } from '@/components/dojo/useJsonlPlayer';
import { useA2UISurface } from '@/components/dojo/useA2UISurface';
import { A2UIViewer } from '@copilotkit/a2ui-renderer';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { scenarios, ScenarioId } from '@/data/dojo';

/** Generate a human-readable summary for an A2UI message */
function summarizeMessage(msg: any, index: number): string {
  if (msg.beginRendering) {
    const sid = msg.beginRendering.surfaceId || 'default';
    const root = msg.beginRendering.root || 'root';
    return `Create surface "${sid}" with root component "${root}"`;
  }
  if (msg.createSurface) {
    const sid = msg.createSurface.surfaceId || 'default';
    return `Create surface "${sid}" (v0.9)`;
  }
  if (msg.surfaceUpdate) {
    const count = msg.surfaceUpdate.components?.length || 0;
    const types = msg.surfaceUpdate.components
      ?.map((c: any) => {
        if (c.component) return Object.keys(c.component)[0];
        if (c.type) return c.type;
        return '?';
      })
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      .join(', ');
    return `Update ${count} components: ${types}`;
  }
  if (msg.updateComponents) {
    const count = msg.updateComponents.components?.length || 0;
    const types = msg.updateComponents.components
      ?.map((c: any) => c.type || '?')
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      .join(', ');
    return `Update ${count} components: ${types}`;
  }
  if (msg.dataModelUpdate) {
    const keys = msg.dataModelUpdate.contents
      ?.map((c: any) => c.key)
      .filter(Boolean)
      .join(', ');
    return `Set data: ${keys}`;
  }
  if (msg.updateDataModel) {
    const keys = msg.updateDataModel.contents
      ?.map((c: any) => c.key)
      .filter(Boolean)
      .join(', ');
    return `Set data: ${keys}`;
  }
  if (msg.clientEvent) {
    return `User action: ${msg.clientEvent.name || 'event'}`;
  }
  if (msg.deleteSurface) {
    return `Delete surface "${msg.deleteSurface.surfaceId}"`;
  }
  return `Step ${index + 1}`;
}

export default function DojoPage() {
  const [activeTab, setActiveTab] = useState<'data' | 'config'>('data');
  const [mobileView, setMobileView] = useState<'data' | 'config' | 'renderers'>('renderers');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('restaurant-booking');

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

  const surfaceState = useA2UISurface(activeMessages);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step) {
      seek(parseInt(step, 10));
    }
  }, []);

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
      <header className="relative z-10 flex h-auto md:h-16 flex-col md:flex-row items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 md:px-6 md:py-0 backdrop-blur-md">
        
        {/* Left Section: Tab Toggle */}
        <div className="hidden md:flex w-64 items-center gap-1 rounded-xl bg-muted/50 p-1 shadow-inner border border-border/50">
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
        <div className="flex flex-1 w-full md:w-auto max-w-2xl items-center justify-between md:justify-center gap-3 md:gap-6 px-0 md:px-4">
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
            <span className="text-xs font-medium text-muted-foreground w-6 text-right tabular-nums">{progress}</span>
            <div className="relative flex-1 flex items-center h-5">
              <input
                type="range"
                min="0"
                max={totalMessages}
                value={progress}
                onChange={(e) => seek(parseInt(e.target.value, 10))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${totalMessages > 0 ? (progress / totalMessages) * 100 : 0}%` }}
                />
              </div>
              <div 
                className="absolute h-3 w-3 bg-primary rounded-full shadow-sm shadow-primary/40 border border-background transition-transform group-hover:scale-125 duration-200 ease-out pointer-events-none"
                style={{ 
                  left: `calc(${totalMessages > 0 ? (progress / totalMessages) * 100 : 0}% - 6px)`
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
        <div className="flex w-full md:w-64 items-center justify-end mt-1 md:mt-0">
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
        
        {/* Left Pane: JSONL Source + Step Summaries */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className={`bg-muted/20 border-r border-border/50 ${mobileView === "data" || mobileView === "config" ? "flex" : "hidden md:flex"} flex-col`}>
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
                    const isClient = !!msg.action || !!msg.clientEvent;
                    const summary = summarizeMessage(msg, index);
                    
                    return (
                      <div 
                        key={msg.id || index}
                        onClick={() => seek(index)}
                        className={`relative p-3.5 rounded-xl text-[11px] font-mono leading-relaxed transition-all duration-300 ease-out border cursor-pointer ${
                          isActive 
                            ? isClient 
                              ? 'border-purple-500/50 bg-purple-500/5 shadow-[0_0_15px_-3px_rgba(168,85,247,0.1)] ring-1 ring-purple-500/20 scale-[1.02]' 
                              : 'border-primary/50 bg-primary/5 shadow-[0_0_15px_-3px_rgba(var(--primary),0.1)] ring-1 ring-primary/20 scale-[1.02]' 
                            : isPast
                            ? isClient
                              ? 'bg-purple-500/5 border-purple-500/20 text-foreground shadow-sm'
                              : 'bg-card border-border/50 text-foreground shadow-sm'
                            : 'bg-card/50 border-transparent text-muted-foreground opacity-50 hover:opacity-75'
                        }`}
                      >
                        {isActive && (
                          <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 ${isClient ? 'bg-purple-500' : 'bg-primary'} rounded-r-full animate-pulse`} />
                        )}
                        {/* Step number + direction badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold bg-muted/50 rounded px-1.5 py-0.5 tabular-nums">
                            {index + 1}
                          </span>
                          <span className={`text-[9px] font-bold ${isClient ? 'text-purple-500' : 'text-primary/70'}`}>
                            {isClient ? '↑ CLIENT' : '↓ SERVER'}
                          </span>
                        </div>
                        {/* Human-readable summary */}
                        <div className={`text-xs font-sans font-medium mb-2 ${isActive ? 'text-foreground' : isPast ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                          {summary}
                        </div>
                        {/* Collapsible raw JSON */}
                        <details className="group">
                          <summary className="text-[9px] text-muted-foreground cursor-pointer hover:text-foreground select-none">
                            Raw JSON ▸
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap overflow-x-auto custom-scrollbar-sm text-[10px]">
                            {JSON.stringify(msg, null, 2)}
                          </pre>
                        </details>
                      </div>
                    );
                  })}
                  <div ref={streamEndRef} className="h-2" />
                </div>
              ) : (
                <div className="space-y-6">
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

        <ResizableHandle withHandle className="hidden md:flex bg-border/50 hover:bg-primary/50 transition-colors" />

        {/* Right Pane: Single Renderer */}
        <ResizablePanel defaultSize={65} className={`${mobileView === "renderers" ? "flex" : "hidden md:flex"} flex-col`}>
          <div className="h-full bg-muted/10 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto min-h-full">
                <div className="flex flex-col rounded-2xl border border-border/60 bg-background shadow-xl overflow-hidden h-full min-h-[500px] transition-all duration-300 hover:shadow-2xl">
                  <div className="h-11 bg-muted/30 border-b flex items-center px-4 justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5" /> A2UI Renderer
                    </span>
                    <div className="w-10" />
                  </div>
                  <div className="flex-1 p-4 overflow-auto bg-dot-pattern custom-scrollbar">
                    {activeMessages.length > 0 ? (
                      <div className="w-full min-h-full flex items-start justify-center">
                        <A2UIViewer
                          root={surfaceState.root}
                          components={surfaceState.components}
                          data={surfaceState.data}
                          onAction={(action) => console.log('Dojo Action:', action)}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <Code2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-sm text-foreground mb-1">{'<A2UIRenderer />'}</p>
                          <p className="text-xs text-muted-foreground">Press play to start the scenario</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile Nav Tabs */}
      <div className="flex md:hidden w-full items-center gap-1 bg-background/95 backdrop-blur-md p-2 border-t border-border/50 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button variant="ghost" size="sm" className={`flex-1 h-12 flex-col gap-1 text-[10px] font-medium ${mobileView === 'data' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => { setMobileView('data'); setActiveTab('data'); }}>
          <Zap className="h-4 w-4 mb-0" /> Data
        </Button>
        <Button variant="ghost" size="sm" className={`flex-1 h-12 flex-col gap-1 text-[10px] font-medium ${mobileView === 'renderers' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setMobileView('renderers')}>
          <LayoutTemplate className="h-4 w-4 mb-0" /> Render
        </Button>
        <Button variant="ghost" size="sm" className={`flex-1 h-12 flex-col gap-1 text-[10px] font-medium ${mobileView === 'config' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => { setMobileView('config'); setActiveTab('config'); }}>
          <Settings className="h-4 w-4 mb-0" /> Config
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
        .custom-scrollbar-sm::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-sm::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-sm::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 10px; }
        .bg-dot-pattern {
          background-image: radial-gradient(rgba(156, 163, 175, 0.2) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}} />
    </div>
  );
}
