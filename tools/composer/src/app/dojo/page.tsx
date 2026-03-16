'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, Settings, FileJson, 
  ChevronDown, Activity, Code2,
  Zap, LayoutTemplate, Monitor, Database
} from 'lucide-react';
import { useStreamingPlayer } from '@/components/dojo/useStreamingPlayer';
import { useA2UISurface } from '@/components/dojo/useA2UISurface';
import { A2UIViewer } from '@copilotkit/a2ui-renderer';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { scenarios, ScenarioId } from '@/data/dojo';

const RENDERERS = ['Lit (Web Components)', 'React', 'Angular'] as const;
type RendererType = typeof RENDERERS[number];
type LeftTab = 'events' | 'data' | 'config';

function updateURL(scenario: string, step: number, renderer: string) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  params.set('scenario', scenario);
  if (step > 0) params.set('step', String(step));
  if (renderer !== RENDERERS[0]) params.set('renderer', renderer);
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

function readURL(): { scenario?: string; step?: number; renderer?: string } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    scenario: params.get('scenario') || undefined,
    step: params.get('step') ? parseInt(params.get('step')!, 10) : undefined,
    renderer: params.get('renderer') || undefined,
  };
}

export default function DojoPage() {
  const [leftTab, setLeftTab] = useState<LeftTab>('events');
  const [mobileView, setMobileView] = useState<'left' | 'renderer'>('renderer');
  const [renderer, setRenderer] = useState<RendererType>(RENDERERS[0]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>(() => {
    const url = readURL();
    return (url.scenario && url.scenario in scenarios) ? url.scenario as ScenarioId : 'restaurant-booking';
  });

  const {
    playbackState,
    streamProgress,
    totalStreamLines,
    speed,
    visibleLines,
    activeMessages,
    visibleEvents,
    completedMessageCount,
    currentStreamingMessage,
    play,
    pause,
    stop,
    seek,
    seekToMessageEnd,
    setSpeed,
  } = useStreamingPlayer((scenarios[selectedScenario] as any) || [], 60);

  const surfaceState = useA2UISurface(activeMessages);

  useEffect(() => {
    const url = readURL();
    if (url.renderer && RENDERERS.includes(url.renderer as RendererType)) setRenderer(url.renderer as RendererType);
    if (url.step !== undefined) seek(url.step);
  }, []);

  useEffect(() => {
    updateURL(selectedScenario, streamProgress, renderer);
  }, [selectedScenario, streamProgress, renderer]);

  const handleScenarioChange = useCallback((id: ScenarioId) => {
    setSelectedScenario(id);
    stop();
  }, [stop]);

  // Auto-scroll
  const dataEndRef = useRef<HTMLDivElement>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (playbackState === 'playing') {
      dataEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      eventsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [streamProgress, playbackState]);

  // Group visible lines by message direction sections
  const groupedLines = (() => {
    const groups: { isClient: boolean; messageIndex: number; lines: typeof visibleLines }[] = [];
    let current: typeof groups[0] | null = null;
    for (const line of visibleLines) {
      if (!current || current.messageIndex !== line.messageIndex) {
        current = { isClient: line.isClient, messageIndex: line.messageIndex, lines: [] };
        groups.push(current);
      }
      current.lines.push(line);
    }
    return groups;
  })();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Header — playback controls only, no scenario */}
      <header className="relative z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 md:px-6 backdrop-blur-md">
        {/* Left: Tab toggle */}
        <div className="hidden md:flex items-center gap-1 rounded-xl bg-muted/50 p-1 shadow-inner border border-border/50">
          {([
            { id: 'events' as LeftTab, icon: Activity, label: 'Events' },
            { id: 'data' as LeftTab, icon: Database, label: 'Data' },
            { id: 'config' as LeftTab, icon: Settings, label: 'Config' },
          ]).map(tab => (
            <Button key={tab.id} variant="ghost" size="sm"
              className={`h-8 text-xs font-medium px-3 gap-1.5 rounded-lg transition-all ${leftTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setLeftTab(tab.id)}
            >
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </Button>
          ))}
        </div>

        {/* Center: Playback */}
        <div className="flex flex-1 max-w-2xl items-center gap-3 md:gap-5">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50" onClick={stop}>
              <SkipBack className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            {playbackState === 'playing' ? (
              <Button variant="default" size="icon" className="h-9 w-9 rounded-full shadow-md" onClick={pause}>
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="default" size="icon" className="h-9 w-9 rounded-full shadow-md bg-primary" onClick={play}>
                <Play className="h-4 w-4 ml-0.5" />
              </Button>
            )}
          </div>
          <div className="flex-1 flex items-center gap-3 group">
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right tabular-nums">{streamProgress}</span>
            <div className="relative flex-1 flex items-center h-5">
              <input type="range" min="0" max={totalStreamLines} value={streamProgress}
                onChange={(e) => seek(parseInt(e.target.value, 10))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-100 ease-out"
                  style={{ width: `${totalStreamLines > 0 ? (streamProgress / totalStreamLines) * 100 : 0}%` }}
                />
              </div>
              <div className="absolute h-2.5 w-2.5 bg-primary rounded-full shadow-sm border border-background pointer-events-none"
                style={{ left: `calc(${totalStreamLines > 0 ? (streamProgress / totalStreamLines) * 100 : 0}% - 5px)` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-8 tabular-nums">{totalStreamLines}</span>
          </div>
          <Button variant="outline" size="sm"
            className="h-7 w-12 text-[10px] font-mono font-medium rounded-full border-border/50"
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : speed === 4 ? 0.5 : 1)}
          >
            {speed}x
          </Button>
        </div>

        {/* Right: streaming status */}
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          {currentStreamingMessage !== null && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Streaming...
            </span>
          )}
          <span className="font-mono tabular-nums">{completedMessageCount}/{(scenarios[selectedScenario] as any)?.length || 0}</span>
        </div>
      </header>

      {/* Main Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Pane */}
        <ResizablePanel defaultSize={38} minSize={25} maxSize={55}
          className={`bg-muted/20 border-r border-border/50 ${mobileView === 'left' ? 'flex' : 'hidden md:flex'} flex-col`}
        >
          <div className="h-full flex flex-col relative">
            <div className="absolute inset-0 overflow-y-auto p-4 custom-scrollbar">

              {leftTab === 'events' ? (
                /* EVENTS TAB — lifecycle summaries */
                <div className="flex flex-col gap-2 pb-8">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Activity className="h-3 w-3 text-primary" /> Lifecycle Events
                  </h2>
                  {visibleEvents.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Press play to see events...</p>
                  )}
                  {visibleEvents.map((evt, i) => (
                    <div key={i}
                      onClick={() => seekToMessageEnd(evt.messageIndex)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                        evt.type === 'surface' ? 'border-blue-500/30 bg-blue-500/5' :
                        evt.type === 'components' ? 'border-emerald-500/30 bg-emerald-500/5' :
                        evt.type === 'data' ? 'border-amber-500/30 bg-amber-500/5' :
                        evt.type === 'action' ? 'border-purple-500/30 bg-purple-500/5' :
                        'border-red-500/30 bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase ${
                          evt.type === 'surface' ? 'text-blue-500' :
                          evt.type === 'components' ? 'text-emerald-500' :
                          evt.type === 'data' ? 'text-amber-500' :
                          evt.type === 'action' ? 'text-purple-500' :
                          'text-red-500'
                        }`}>
                          {evt.type === 'action' ? '↑' : '↓'} {evt.type}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground/90">{evt.summary}</p>
                    </div>
                  ))}
                  <div ref={eventsEndRef} className="h-2" />
                </div>

              ) : leftTab === 'data' ? (
                /* DATA TAB — raw streaming lines */
                <div className="flex flex-col gap-0 pb-8">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                    <Database className="h-3 w-3 text-amber-500" /> Raw Stream
                  </h2>
                  {groupedLines.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Press play to see streaming data...</p>
                  )}
                  {groupedLines.map((group, gi) => (
                    <div key={gi} className="mb-3">
                      {/* Section header */}
                      <div className={`text-[9px] font-bold mb-1 ${group.isClient ? 'text-purple-500' : 'text-primary/70'}`}>
                        {group.isClient ? '↑ CLIENT' : '↓ SERVER'} — message {group.messageIndex + 1}
                      </div>
                      {/* Streaming lines */}
                      <div className={`rounded-lg border p-2 font-mono text-[10px] leading-relaxed ${
                        group.isClient 
                          ? 'border-purple-500/20 bg-purple-500/5' 
                          : 'border-primary/20 bg-card'
                      }`}>
                        {group.lines.map((line, li) => (
                          <div key={li}
                            onClick={() => seek(visibleLines.indexOf(line) + 1)}
                            className={`cursor-pointer hover:bg-primary/5 px-1 rounded transition-colors ${
                              line === visibleLines[visibleLines.length - 1] ? 'bg-primary/10 font-semibold' : ''
                            }`}
                          >
                            {line.text}
                          </div>
                        ))}
                        {/* Show streaming cursor if this message is currently being streamed */}
                        {currentStreamingMessage === group.messageIndex && (
                          <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-1" />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={dataEndRef} className="h-2" />
                </div>

              ) : (
                /* CONFIG TAB */
                <div className="space-y-5">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Settings className="h-3 w-3" /> Configuration
                  </h2>
                  {/* Scenario */}
                  <div className="rounded-lg border border-border/50 bg-card p-4 shadow-sm space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" /> Scenario
                    </h3>
                    <div className="relative">
                      <select value={selectedScenario}
                        onChange={(e) => handleScenarioChange(e.target.value as ScenarioId)}
                        className="w-full text-sm p-2 pl-3 pr-8 border border-border/50 rounded-lg bg-background appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      >
                        {Object.keys(scenarios).map(id => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {(scenarios[selectedScenario] as any)?.length || 0} messages • {totalStreamLines} stream lines
                    </p>
                  </div>
                  {/* Renderer */}
                  <div className="rounded-lg border border-border/50 bg-card p-4 shadow-sm space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-primary" /> Renderer
                    </h3>
                    <div className="relative">
                      <select value={renderer}
                        onChange={(e) => setRenderer(e.target.value as RendererType)}
                        className="w-full text-sm p-2 pl-3 pr-8 border border-border/50 rounded-lg bg-background appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      >
                        {RENDERERS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  {/* Transport */}
                  <div className="rounded-lg border border-border/50 bg-card p-4 shadow-sm space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Transport
                    </h3>
                    <div className="relative">
                      <select className="w-full text-sm p-2 pl-3 pr-8 border border-border/50 rounded-lg bg-background appearance-none shadow-sm cursor-pointer">
                        <option>A2A (Server Sent Events)</option>
                        <option>AG UI (Stream)</option>
                        <option>WebSocket</option>
                        <option>REST Polling</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Simulated in-memory playback.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden md:flex bg-border/50 hover:bg-primary/50 transition-colors" />

        {/* Right Pane: Renderer */}
        <ResizablePanel defaultSize={62} className={`${mobileView === 'renderer' ? 'flex' : 'hidden md:flex'} flex-col`}>
          <div className="h-full bg-muted/10 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col rounded-2xl border border-border/60 bg-background shadow-xl overflow-hidden min-h-[500px]">
                  <div className="h-10 bg-muted/30 border-b flex items-center px-4 justify-between">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400/80" />
                      <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                      <div className="w-2 h-2 rounded-full bg-green-400/80" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
                      <Code2 className="h-3 w-3" /> {renderer}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{selectedScenario}</span>
                  </div>
                  <div className="p-4 bg-dot-pattern">
                    {activeMessages.length > 0 ? (
                      <div className="w-full flex items-start justify-center">
                        <A2UIViewer
                          root={surfaceState.root}
                          components={surfaceState.components}
                          data={surfaceState.data}
                          onAction={(action) => console.log('Dojo Action:', action)}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Code2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-sm text-foreground mb-0.5">{'<A2UIRenderer />'}</p>
                          <p className="text-xs text-muted-foreground">Press play to start streaming</p>
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

      {/* Mobile Nav */}
      <div className="flex md:hidden w-full items-center gap-1 bg-background/95 backdrop-blur-md p-2 border-t border-border/50 z-50">
        {([
          { view: 'left' as const, tab: 'events' as LeftTab, icon: Activity, label: 'Events' },
          { view: 'renderer' as const, tab: null, icon: LayoutTemplate, label: 'Render' },
          { view: 'left' as const, tab: 'data' as LeftTab, icon: Database, label: 'Data' },
          { view: 'left' as const, tab: 'config' as LeftTab, icon: Settings, label: 'Config' },
        ]).map(item => (
          <Button key={item.label} variant="ghost" size="sm"
            className={`flex-1 h-11 flex-col gap-0.5 text-[9px] font-medium ${
              (item.tab ? mobileView === 'left' && leftTab === item.tab : mobileView === 'renderer')
                ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => { setMobileView(item.view); if (item.tab) setLeftTab(item.tab); }}
          >
            <item.icon className="h-3.5 w-3.5" /> {item.label}
          </Button>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156,163,175,0.5); }
        .bg-dot-pattern { background-image: radial-gradient(rgba(156,163,175,0.15) 1px, transparent 1px); background-size: 16px 16px; }
      `}} />
    </div>
  );
}
