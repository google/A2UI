
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

type LogEntry = {
    type: 'incoming' | 'outgoing' | 'info';
    timestamp: string;
    summary: string;
    detail: any;
    id: number;
};

@customElement("debug-panel")
export class DebugPanel extends LitElement {
    @property({ type: Boolean }) accessor isOpen = true;
    @state() accessor logs: LogEntry[] = [];
    @state() accessor selectedLogId: number | null = null;

    private nextId = 0;

    @state() accessor panelHeight = 400;
    @state() accessor isResizing = false;

    private startY = 0;
    private startHeight = 0;

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: monospace;
            border-top: 1px solid #333;
            overflow: hidden;
            position: relative;
        }

        .resize-handle {
            height: 4px;
            background: #333;
            cursor: ns-resize;
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 10;
        }
        
        .resize-handle:hover, :host(.resizing) .resize-handle {
            background: #007acc;
        }
        
        :host([isopen="false"]) {
            height: 32px !important;
        }
        
        .header {
            display: flex;
            align-items: center;
            padding: 4px 8px;
            background: #252526;
            border-bottom: 1px solid #333;
            user-select: none;
            margin-top: 4px; /* Space for handle */
        }
        
        .title {
            flex: 1;
            font-weight: bold;
            font-size: 12px;
        }

        .controls {
            display: flex;
            gap: 8px;
        }

        button {
            background: #333;
            border: 1px solid #444;
            color: #ccc;
            cursor: pointer;
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
        }
        
        button:hover {
            background: #444;
        }

        .content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .log-list {
            flex: 1;
            overflow-y: auto;
            border-right: 1px solid #333;
            padding: 4px 0;
        }
        
        .log-item {
            padding: 4px 8px;
            cursor: pointer;
            font-size: 11px;
            display: flex;
            gap: 8px;
            border-bottom: 1px solid #2a2a2a;
        }
        
        .log-item:hover {
            background: #2a2a2d;
        }
        
        .log-item.selected {
            background: #37373d;
        }
        
        .log-type {
            font-weight: bold;
            width: 60px;
            flex-shrink: 0;
        }
        
        .type-incoming { color: #4ec9b0; }
        .type-outgoing { color: #ce9178; }
        .type-info { color: #569cd6; }

        .log-time {
            color: #888;
            flex-shrink: 0;
        }

        .log-summary {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .detail-view {
            flex: 1.5;
            overflow-y: auto;
            padding: 8px;
            white-space: pre-wrap;
            font-size: 11px;
            background: #1e1e1e;
        }
    `;

    addLog(type: 'incoming' | 'outgoing' | 'info', summary: string, detail: any) {
        this.logs = [...this.logs, {
            type,
            timestamp: new Date().toLocaleTimeString(),
            summary,
            detail,
            id: this.nextId++
        }];
    }

    private startResize(e: MouseEvent) {
        this.isResizing = true;
        this.startY = e.clientY;
        this.startHeight = this.getBoundingClientRect().height;

        window.addEventListener('mousemove', this.doResize);
        window.addEventListener('mouseup', this.stopResize);
        this.classList.add('resizing');
    }

    private doResize = (e: MouseEvent) => {
        if (!this.isResizing) return;
        const delta = this.startY - e.clientY;
        const newHeight = this.startHeight + delta;
        this.panelHeight = Math.max(100, Math.min(window.innerHeight - 50, newHeight));
    }

    private stopResize = () => {
        this.isResizing = false;
        window.removeEventListener('mousemove', this.doResize);
        window.removeEventListener('mouseup', this.stopResize);
        this.classList.remove('resizing');
    }

    render() {
        const selectedLog = this.logs.find(l => l.id === this.selectedLogId);

        return html`
            <div class="resize-handle" @mousedown=${this.startResize}></div>
            <div class="header">
                <span class="title">Debug Panel (${this.logs.length} events)</span>
                <div class="controls">
                    <button @click=${() => this.logs = []}>Clear</button>
                    <button @click=${() => this.isOpen = !this.isOpen}>
                        ${this.isOpen ? 'Minimize' : 'Expand'}
                    </button>
                </div>
            </div>
            ${this.isOpen ? html`
                <style>
                    :host { height: ${this.panelHeight}px; }
                </style>
                <div class="content">
                    <div class="log-list">
                        ${this.logs.slice().reverse().map(log => html`
                            <div class="log-item ${log.id === this.selectedLogId ? 'selected' : ''}"
                                 @click=${() => this.selectedLogId = log.id}>
                                <span class="log-time">${log.timestamp}</span>
                                <span class="log-type type-${log.type}">${log.type.toUpperCase()}</span>
                                <span class="log-summary">${log.summary}</span>
                            </div>
                        `)}
                    </div>
                    <div class="detail-view">
                        ${selectedLog
                    ? JSON.stringify(selectedLog.detail, null, 2)
                    : 'Select an event to view details.'}
                    </div>
                </div>
            ` : nothing}
        `;
    }
}
