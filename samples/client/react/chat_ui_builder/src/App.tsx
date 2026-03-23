import {FormEvent, type Dispatch, type SetStateAction, useCallback, useMemo, useRef, useState} from 'react';
import {A2UIProvider, A2UIRenderer, ComponentRegistry, useA2UIActions} from '@a2ui/react';
import type {Types} from '@a2ui/react';
import {FlowDiagram} from './components/FlowDiagram';

const DEFAULT_API_BASE = 'http://localhost:8010';
const MAX_LOG_ENTRIES = 40;

const EXAMPLES = [
  '请生成一个客户概览卡片，包含姓名 Alice、客户等级 VIP、最近两笔订单，并提供一个“跟进客户”按钮。',
  '请生成一个缺陷分诊面板，包含标题“生产故障”、严重级别“高”、负责人“平台团队”，并添加“立即升级”和“记录备注”两个动作。',
  '请生成一个会议准备表单，包含参会人姓名、会议时间、议程、是否需要录屏，以及一个“提交准备信息”按钮。',
  '请生成一个请假审批流程图，包含提交申请、主管审批、通过、驳回修改四个节点，并在下方放一个“发起审批”按钮。',
];

const registry = ComponentRegistry.getInstance();
if (!registry.has('FlowDiagram')) {
  registry.register('FlowDiagram', {component: FlowDiagram});
}

interface ShellProps {
  onAction: (message: Types.A2UIClientEventMessage) => void;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function pushEntry(setter: Dispatch<SetStateAction<string[]>>, entry: string) {
  setter((prev) => [...prev, entry].slice(-MAX_LOG_ENTRIES));
}

function Shell({onAction}: ShellProps) {
  const {processMessages, clearSurfaces} = useA2UIActions();
  const [input, setInput] = useState(EXAMPLES[0]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [history, setHistory] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [frames, setFrames] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (message: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      clearSurfaces();
      setFrames([]);
      setStatus('streaming');
      setError(null);
      pushEntry(setHistory, `用户输入：${message}`);
      pushEntry(setHistory, `请求地址：${apiBase}/api/chat/stream`);

      try {
        const response = await fetch(`${apiBase}/api/chat/stream`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message}),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`请求失败，状态码 ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, {stream: true});
          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) {
              const frame = JSON.parse(line) as Types.ServerToClientMessage;
              pushEntry(setFrames, formatJson(frame));
              processMessages([frame]);
            }
            newlineIndex = buffer.indexOf('\n');
          }
        }

        const tail = buffer.trim();
        if (tail) {
          const frame = JSON.parse(tail) as Types.ServerToClientMessage;
          pushEntry(setFrames, formatJson(frame));
          processMessages([frame]);
        }

        pushEntry(setHistory, '渲染完成：已接收并处理 A2UI 数据帧。');
        setStatus('idle');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('idle');
          pushEntry(setHistory, '上一次请求已取消。');
          return;
        }
        const messageText = err instanceof Error ? err.message : '流式请求失败';
        setStatus('error');
        setError(messageText);
        pushEntry(setHistory, `错误：${messageText}`);
      }
    },
    [apiBase, clearSurfaces, processMessages]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      await submit(trimmed);
    },
    [input, submit]
  );

  const exampleButtons = useMemo(
    () =>
      EXAMPLES.map((example) => (
        <button key={example} type="button" className="example-chip" onClick={() => setInput(example)}>
          {example}
        </button>
      )),
    []
  );

  const handleAction = useCallback(
    (message: Types.A2UIClientEventMessage) => {
      onAction(message);
      const action = message.userAction;
      const actionName = action?.name ?? 'unknown';
      const context = action?.context ? formatJson(action.context) : '{}';
      pushEntry(setActions, `动作：${actionName} ${context}`);
      pushEntry(setHistory, `点击动作：${actionName}`);
    },
    [onAction]
  );

  return (
    <div className="page-shell">
      <aside className="control-panel">
        <div>
          <p className="eyebrow">演示</p>
          <h1>聊天式 A2UI 生成器</h1>
          <p className="description">
            左侧输入中文需求，前端通过 <code>fetch + ReadableStream</code> 接收后端返回的 NDJSON A2UI
            帧，并调用 <code>@a2ui/react</code> 的渲染能力实时更新右侧界面。
          </p>
        </div>

        <div className="info-card">
          <p className="section-title">前端实现说明</p>
          <ul className="bullet-list">
            <li>使用 <code>@a2ui/react</code> 提供的 <code>A2UIProvider</code>、<code>A2UIRenderer</code> 与 <code>useA2UIActions</code>。</li>
            <li>通过 <code>response.body.getReader()</code> 逐行解析 <code>application/x-ndjson</code>。</li>
            <li>每收到一帧就调用 <code>processMessages([frame])</code>，因此界面会增量更新而不是一次性刷新。</li>
          </ul>
        </div>

        <label className="field-group">
          <span>后端地址</span>
          <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
        </label>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>需求描述</span>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} />
          </label>
          <div className="button-row">
            <button type="submit" disabled={status === 'streaming'}>
              {status === 'streaming' ? '生成中…' : '生成界面'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                abortRef.current?.abort();
                clearSurfaces();
                setFrames([]);
                pushEntry(setHistory, '已清空画布。');
              }}
            >
              清空画布
            </button>
          </div>
        </form>

        <div>
          <p className="section-title">示例需求</p>
          <div className="example-list">{exampleButtons}</div>
        </div>

        <div className="status-panel">
          <p className="section-title">当前状态</p>
          <p className={`status-badge ${status}`}>
            {status === 'idle' ? '空闲' : status === 'streaming' ? '流式生成中' : '出错'}
          </p>
          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <div>
          <p className="section-title">交互日志</p>
          <ul className="history-list">
            {history.length === 0 ? <li>还没有请求记录。</li> : null}
            {history.slice().reverse().map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-title">A2UI 动作回调</p>
          <ul className="history-list">
            {actions.length === 0 ? <li>还没有触发动作按钮。</li> : null}
            {actions.slice().reverse().map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-title">已接收 A2UI 数据帧</p>
          <div className="frame-list">
            {frames.length === 0 ? <p className="empty-state">等待后端返回数据帧…</p> : null}
            {frames.slice().reverse().map((entry, index) => (
              <pre key={`${index}-${entry}`} className="frame-entry">
                {entry}
              </pre>
            ))}
          </div>
        </div>
      </aside>

      <main className="preview-panel">
        <div className="preview-card">
          <div className="preview-header">
            <div>
              <p className="eyebrow">实时预览</p>
              <h2>由 A2UI 帧驱动的界面</h2>
              <p className="preview-copy">如果模型返回了卡片、按钮、表单等组件，这里会直接按 A2UI 组件树渲染。</p>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                handleAction({
                  userAction: {
                    name: 'frontend_ping',
                    surfaceId: 'main',
                    sourceComponentId: 'preview-header',
                    timestamp: new Date().toISOString(),
                    context: {source: 'preview-header'},
                  },
                } as Types.A2UIClientEventMessage)
              }
            >
              测试动作回调
            </button>
          </div>
          <div className="render-surface">
            <A2UIRenderer surfaceId="main" registry={registry} />
          </div>
        </div>
      </main>
    </div>
  );
}

export function App() {
  const [lastAction, setLastAction] = useState<Types.A2UIClientEventMessage | null>(null);

  const handleAction = useCallback((message: Types.A2UIClientEventMessage) => {
    setLastAction(message);
    console.info('A2UI action received:', message);
  }, []);

  return (
    <A2UIProvider onAction={handleAction}>
      <Shell onAction={handleAction} />
      {lastAction ? (
        <div className="action-toast">最近动作：{lastAction.userAction?.name ?? 'unknown'}</div>
      ) : null}
    </A2UIProvider>
  );
}
