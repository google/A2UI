import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export type PlaybackState = 'playing' | 'paused' | 'stopped';

export interface StreamLine {
  /** Index of the parent message in the scenario */
  messageIndex: number;
  /** The line number within the stringified JSON (0-based) */
  lineIndex: number;
  /** The actual text content of this line */
  text: string;
  /** Whether this is a client event (↑) or server event (↓) */
  isClient: boolean;
  /** Whether this is the first line of a new message */
  isFirstLine: boolean;
  /** Whether this is the last line of a message */
  isLastLine: boolean;
}

export interface LifecycleEvent {
  /** Which stream line triggered this */
  streamLineIndex: number;
  /** The parent message index */
  messageIndex: number;
  /** Human-readable description */
  summary: string;
  /** Event category */
  type: 'surface' | 'components' | 'data' | 'action' | 'delete';
}

/** Explode scenario messages into individual streamable lines */
function explodeToStreamLines(messages: any[]): StreamLine[] {
  const lines: StreamLine[] = [];
  for (let mi = 0; mi < messages.length; mi++) {
    const msg = messages[mi];
    const isClient = !!msg.action || !!msg.clientEvent;
    const jsonStr = JSON.stringify(msg, null, 2);
    const jsonLines = jsonStr.split('\n');
    for (let li = 0; li < jsonLines.length; li++) {
      lines.push({
        messageIndex: mi,
        lineIndex: li,
        text: jsonLines[li] ?? '',
        isClient,
        isFirstLine: li === 0,
        isLastLine: li === jsonLines.length - 1,
      });
    }
  }
  return lines;
}

/** Generate lifecycle events from messages */
function generateLifecycleEvents(messages: any[], streamLines: StreamLine[]): LifecycleEvent[] {
  const events: LifecycleEvent[] = [];
  // Find stream line index for the last line of each message
  const messageEndLines = new Map<number, number>();
  for (let i = 0; i < streamLines.length; i++) {
    const sl = streamLines[i];
    if (sl && sl.isLastLine) {
      messageEndLines.set(sl.messageIndex, i);
    }
  }

  for (let mi = 0; mi < messages.length; mi++) {
    const msg = messages[mi];
    const streamIdx = messageEndLines.get(mi) ?? 0;

    if (msg.beginRendering) {
      const sid = msg.beginRendering.surfaceId || 'default';
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `Surface "${sid}" created`, type: 'surface' });
    }
    if (msg.createSurface) {
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `Surface "${msg.createSurface.surfaceId}" created (v0.9)`, type: 'surface' });
    }
    if (msg.surfaceUpdate) {
      const count = msg.surfaceUpdate.components?.length || 0;
      const types = msg.surfaceUpdate.components
        ?.map((c: any) => c.component ? Object.keys(c.component)[0] : c.type || '?')
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `${count} components registered: ${types?.join(', ')}`, type: 'components' });
    }
    if (msg.updateComponents) {
      const count = msg.updateComponents.components?.length || 0;
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `${count} components updated`, type: 'components' });
    }
    if (msg.dataModelUpdate) {
      const keys = msg.dataModelUpdate.contents?.map((c: any) => c.key).filter(Boolean) || [];
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `Data model updated: ${keys.join(', ')}`, type: 'data' });
    }
    if (msg.updateDataModel) {
      const keys = msg.updateDataModel.contents?.map((c: any) => c.key).filter(Boolean) || [];
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `Data model updated: ${keys.join(', ')}`, type: 'data' });
    }
    if (msg.clientEvent || msg.action) {
      const name = msg.clientEvent?.name || msg.action?.name || 'action';
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `User action: ${name}`, type: 'action' });
    }
    if (msg.deleteSurface) {
      events.push({ streamLineIndex: streamIdx, messageIndex: mi, summary: `Surface "${msg.deleteSurface.surfaceId}" deleted`, type: 'delete' });
    }
  }
  return events;
}

export function useStreamingPlayer(messages: any[], baseIntervalMs = 80) {
  const streamLines = useMemo(() => explodeToStreamLines(messages), [messages]);
  const lifecycleEvents = useMemo(() => generateLifecycleEvents(messages, streamLines), [messages, streamLines]);

  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [streamProgress, setStreamProgress] = useState(0); // index into streamLines
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalStreamLines = streamLines.length;

  // Reset on messages change
  useEffect(() => {
    setStreamProgress(0);
    setPlaybackState('stopped');
  }, [messages]);

  const play = useCallback(() => {
    if (streamProgress >= totalStreamLines) setStreamProgress(0);
    setPlaybackState('playing');
  }, [streamProgress, totalStreamLines]);

  const pause = useCallback(() => setPlaybackState('paused'), []);

  const stop = useCallback(() => {
    setPlaybackState('stopped');
    setStreamProgress(0);
  }, []);

  const seek = useCallback((index: number) => {
    setStreamProgress(Math.max(0, Math.min(index, totalStreamLines)));
  }, [totalStreamLines]);

  /** Seek to the start of a specific message */
  const seekToMessage = useCallback((messageIndex: number) => {
    const idx = streamLines.findIndex(l => l.messageIndex === messageIndex);
    if (idx >= 0) setStreamProgress(idx);
  }, [streamLines]);

  /** Seek to the end of a specific message (fully delivered) */
  const seekToMessageEnd = useCallback((messageIndex: number) => {
    let lastIdx = 0;
    for (let i = 0; i < streamLines.length; i++) {
      const sl = streamLines[i];
      if (sl && sl.messageIndex === messageIndex) lastIdx = i;
    }
    setStreamProgress(lastIdx + 1);
  }, [streamLines]);

  // Playback timer
  useEffect(() => {
    if (playbackState === 'playing') {
      const ms = baseIntervalMs / speed;
      timerRef.current = setInterval(() => {
        setStreamProgress(prev => {
          if (prev >= totalStreamLines) {
            setPlaybackState('paused');
            return prev;
          }
          return prev + 1;
        });
      }, ms);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playbackState, speed, totalStreamLines, baseIntervalMs]);

  // Visible stream lines (up to current progress)
  const visibleLines = streamLines.slice(0, streamProgress);

  // Which full messages have been completely delivered
  const completedMessageCount = useMemo(() => {
    if (streamProgress === 0) return 0;
    const lastVisible = streamLines[streamProgress - 1];
    if (!lastVisible) return 0;
    // A message is complete if its last line has been shown
    if (lastVisible.isLastLine) return lastVisible.messageIndex + 1;
    return lastVisible.messageIndex;
  }, [streamProgress, streamLines]);

  // Active messages for the renderer (only fully delivered ones)
  const activeMessages = messages.slice(0, completedMessageCount);

  // Which lifecycle events are visible
  const visibleEvents = lifecycleEvents.filter(e => e.streamLineIndex < streamProgress);

  // Current message being streamed
  const currentStreamingMessage = useMemo(() => {
    if (streamProgress === 0) return null;
    const line = streamLines[streamProgress - 1];
    if (!line) return null;
    if (line.isLastLine) return null; // fully delivered, not "streaming"
    return line.messageIndex;
  }, [streamProgress, streamLines]);

  return {
    playbackState,
    streamProgress,
    totalStreamLines,
    speed,
    visibleLines,
    activeMessages,
    visibleEvents,
    lifecycleEvents,
    completedMessageCount,
    currentStreamingMessage,
    play,
    pause,
    stop,
    seek,
    seekToMessage,
    seekToMessageEnd,
    setSpeed,
  };
}
